/**
 * IDS-Think — Insights Engine
 * Schema-agnostic insight generator for any tabular data.
 * Analyzes columns by type, finds patterns, and generates natural language insights.
 */
const ThinkInsights = (() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                      */
  /* ------------------------------------------------------------------ */

  const CONFIG = {
    maxInsights: 15,              // Maximum insights to return
    outlierThreshold: 2.0,        // Z-score threshold for outliers
    correlationThreshold: 0.4,    // Minimum |r| to report correlation
    lowStockThreshold: 30,        // Percentage threshold for "low"
    sampleSize: 1000,             // Max rows to sample for analysis
    significanceMin: 0.2,         // Minimum score to include insight
    trendThreshold: 0.05,         // Minimum trend % to report
    variationThreshold: 0.15,     // Minimum CV to report high variation
    missingThreshold: 0.01,       // Report if > 1% missing
    duplicateThreshold: 0.01,     // Report if > 1% duplicates
  };

  /* ------------------------------------------------------------------ */
  /*  Utility functions                                                  */
  /* ------------------------------------------------------------------ */

  function getValue(row, keyPath) {
    const parts = keyPath.split(".");
    let val = row;
    for (const part of parts) {
      if (val == null) return null;
      val = val[part];
    }
    return val;
  }

  function isNumeric(v) {
    return typeof v === "number" && !isNaN(v);
  }

  function isDateString(v) {
    return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
  }

  function parseDate(v) {
    if (!v) return null;
    const normalized = String(v).replace(" ", "T");
    return new Date(normalized);
  }

  function humanize(str) {
    return String(str)
      .replace(/([a-z])([A-Z])/g, "$1 $2")  // camelCase
      .replace(/_/g, " ")                    // snake_case
      .replace(/\./g, " › ")                 // nested paths
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatNumber(n, decimals = 1) {
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(decimals) + "M";
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(decimals) + "K";
    return n.toFixed(decimals).replace(/\.0+$/, "");
  }

  function formatPercent(n) {
    return (n * 100).toFixed(1).replace(/\.0$/, "") + "%";
  }

  /* ------------------------------------------------------------------ */
  /*  Statistical functions                                              */
  /* ------------------------------------------------------------------ */

  const Stats = {
    sum(arr) {
      return arr.reduce((a, b) => a + b, 0);
    },

    mean(arr) {
      return arr.length ? this.sum(arr) / arr.length : 0;
    },

    median(arr) {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    stdDev(arr) {
      if (arr.length < 2) return 0;
      const avg = this.mean(arr);
      const sqDiffs = arr.map(v => (v - avg) ** 2);
      return Math.sqrt(this.sum(sqDiffs) / (arr.length - 1));
    },

    min(arr) {
      return Math.min(...arr);
    },

    max(arr) {
      return Math.max(...arr);
    },

    zScore(value, mean, stdDev) {
      return stdDev === 0 ? 0 : (value - mean) / stdDev;
    },

    percentile(arr, p) {
      if (!arr.length) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = (p / 100) * (sorted.length - 1);
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      if (lower === upper) return sorted[lower];
      return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
    },

    iqr(arr) {
      return this.percentile(arr, 75) - this.percentile(arr, 25);
    },

    // Pearson correlation coefficient
    correlation(x, y) {
      if (x.length !== y.length || x.length < 3) return 0;
      const n = x.length;
      const meanX = this.mean(x);
      const meanY = this.mean(y);
      let num = 0, denX = 0, denY = 0;
      for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      const den = Math.sqrt(denX * denY);
      return den === 0 ? 0 : num / den;
    },

    // Simple linear regression slope
    trend(values) {
      if (values.length < 2) return 0;
      const n = values.length;
      const x = values.map((_, i) => i);
      const meanX = (n - 1) / 2;
      const meanY = this.mean(values);
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (i - meanX) * (values[i] - meanY);
        den += (i - meanX) ** 2;
      }
      return den === 0 ? 0 : num / den;
    },
  };

  /* ------------------------------------------------------------------ */
  /*  Schema Analysis                                                    */
  /* ------------------------------------------------------------------ */

  const CURRENCY_KEYS = ["amount", "total", "price", "cost", "revenue", "subtotal", "balance", "tax", "fee", "salary", "budget"];
  const PERCENTAGE_KEYS = ["percent", "percentage", "pct", "rate", "ratio"];
  const ID_KEYS = ["id", "uuid", "guid", "key", "code"];
  const STATUS_KEYS = ["status", "state", "condition"];

  function inferColumnType(fieldName, values) {
    const nameLower = fieldName.toLowerCase();
    const lastPart = nameLower.split(".").pop();

    // Sample non-null values
    const samples = values.filter(v => v != null).slice(0, 100);
    if (!samples.length) return { type: "unknown", semantic: null };

    const first = samples[0];

    // Boolean
    if (typeof first === "boolean") {
      return { type: "boolean", semantic: null };
    }

    // Array
    if (Array.isArray(first)) {
      return { type: "array", semantic: null, itemType: typeof first[0] };
    }

    // Number
    if (typeof first === "number") {
      const semantic =
        CURRENCY_KEYS.some(k => lastPart.includes(k)) ? "currency" :
        PERCENTAGE_KEYS.some(k => lastPart.includes(k)) ? "percentage" :
        ID_KEYS.some(k => lastPart === k || lastPart.endsWith("_" + k)) ? "id" :
        null;
      return { type: "numeric", semantic };
    }

    // String analysis
    if (typeof first === "string") {
      // Date detection
      if (isDateString(first)) {
        return { type: "datetime", semantic: null };
      }

      // ID detection (high cardinality, specific patterns)
      if (ID_KEYS.some(k => lastPart === k || lastPart.endsWith("_" + k))) {
        return { type: "text", semantic: "id" };
      }

      // Status detection
      if (STATUS_KEYS.some(k => lastPart.includes(k))) {
        return { type: "category", semantic: "status" };
      }

      // Cardinality check for category vs text
      const unique = new Set(samples);
      const cardinality = unique.size / samples.length;
      if (cardinality < 0.3 && unique.size <= 20) {
        return { type: "category", semantic: null };
      }

      return { type: "text", semantic: null };
    }

    return { type: "unknown", semantic: null };
  }

  function analyzeSchema(rows) {
    if (!rows || !rows.length) return { columns: [], meta: {} };

    const sample = rows.slice(0, CONFIG.sampleSize);
    const columns = [];

    // Recursive key extraction
    function extractKeys(obj, prefix = "") {
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];

        if (Array.isArray(val)) {
          const values = sample.map(r => getValue(r, fullKey)).filter(v => v != null);
          const typeInfo = inferColumnType(fullKey, values);
          columns.push({
            key: fullKey,
            label: humanize(key),
            ...typeInfo,
            isArray: true,
          });
        } else if (val !== null && typeof val === "object") {
          extractKeys(val, fullKey);
        } else {
          const values = sample.map(r => getValue(r, fullKey));
          const typeInfo = inferColumnType(fullKey, values);
          columns.push({
            key: fullKey,
            label: humanize(key),
            ...typeInfo,
            isArray: false,
          });
        }
      }
    }

    extractKeys(rows[0]);

    return {
      columns,
      meta: {
        rowCount: rows.length,
        sampledRows: sample.length,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Column Analyzers                                                   */
  /* ------------------------------------------------------------------ */

  function analyzeNumeric(values, column) {
    const valid = values.filter(isNumeric);
    if (valid.length < 2) return null;

    const mean = Stats.mean(valid);
    const stdDev = Stats.stdDev(valid);
    const min = Stats.min(valid);
    const max = Stats.max(valid);
    const median = Stats.median(valid);

    // Find outliers using IQR method
    const q1 = Stats.percentile(valid, 25);
    const q3 = Stats.percentile(valid, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = valid.filter(v => v < lowerBound || v > upperBound);
    const outlierIndices = values
      .map((v, i) => (isNumeric(v) && (v < lowerBound || v > upperBound)) ? i : -1)
      .filter(i => i >= 0);

    // Trend (if data seems ordered)
    const trend = Stats.trend(valid);
    const trendPercent = mean !== 0 ? (trend / mean) * valid.length : 0;

    return {
      type: "numeric",
      column: column.key,
      label: column.label,
      stats: { mean, stdDev, min, max, median, q1, q3 },
      outliers: { count: outliers.length, indices: outlierIndices.slice(0, 5), values: outliers.slice(0, 5) },
      trend: { slope: trend, percentChange: trendPercent },
      distribution: {
        skew: mean !== median ? (mean > median ? "right" : "left") : "symmetric",
        spread: mean !== 0 ? Math.abs(stdDev / mean) : 0, // coefficient of variation
      },
    };
  }

  function analyzeCategory(values, column) {
    const valid = values.filter(v => v != null);
    if (!valid.length) return null;

    // Count frequencies
    const counts = {};
    for (const v of valid) {
      const key = String(v);
      counts[key] = (counts[key] || 0) + 1;
    }

    // Sort by frequency
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count, percent: count / valid.length }));

    const mode = sorted[0];
    const unique = sorted.length;
    const rare = sorted.filter(s => s.percent < 0.05);

    return {
      type: "category",
      column: column.key,
      label: column.label,
      stats: {
        unique,
        mode: mode.value,
        modeCount: mode.count,
        modePercent: mode.percent,
      },
      distribution: sorted.slice(0, 10),
      rare: rare.slice(0, 5),
    };
  }

  function analyzeDatetime(values, column) {
    const valid = values
      .filter(v => v != null)
      .map(parseDate)
      .filter(d => d && !isNaN(d.getTime()))
      .sort((a, b) => a - b);

    if (valid.length < 2) return null;

    const earliest = valid[0];
    const latest = valid[valid.length - 1];
    const rangeMs = latest - earliest;
    const rangeDays = rangeMs / (1000 * 60 * 60 * 24);

    // Detect gaps (periods with no data)
    const gaps = [];
    const avgGap = rangeMs / (valid.length - 1);
    for (let i = 1; i < valid.length; i++) {
      const gap = valid[i] - valid[i - 1];
      if (gap > avgGap * 3) {
        gaps.push({
          start: valid[i - 1].toISOString().split("T")[0],
          end: valid[i].toISOString().split("T")[0],
          days: Math.round(gap / (1000 * 60 * 60 * 24)),
        });
      }
    }

    return {
      type: "datetime",
      column: column.key,
      label: column.label,
      stats: {
        earliest: earliest.toISOString().split("T")[0],
        latest: latest.toISOString().split("T")[0],
        rangeDays: Math.round(rangeDays),
        count: valid.length,
      },
      gaps: gaps.slice(0, 3),
    };
  }

  function analyzeBoolean(values, column) {
    const valid = values.filter(v => typeof v === "boolean");
    if (!valid.length) return null;

    const trueCount = valid.filter(v => v).length;
    const falseCount = valid.length - trueCount;

    return {
      type: "boolean",
      column: column.key,
      label: column.label,
      stats: {
        trueCount,
        falseCount,
        truePercent: trueCount / valid.length,
        falsePercent: falseCount / valid.length,
      },
    };
  }

  function analyzeArray(values, column, rows) {
    const valid = values.filter(v => Array.isArray(v) && v.length > 0);
    if (!valid.length) return null;

    const lengths = valid.map(a => a.length);
    const totalItems = Stats.sum(lengths);

    // If array contains objects, analyze nested fields
    const nestedInsights = [];
    const firstArray = valid[0];
    if (firstArray.length && typeof firstArray[0] === "object") {
      // Flatten all array items for analysis
      const allItems = valid.flat();
      const keys = Object.keys(firstArray[0]);

      for (const key of keys.slice(0, 5)) { // Limit nested analysis
        const nestedValues = allItems.map(item => item[key]);
        const typeInfo = inferColumnType(key, nestedValues);

        if (typeInfo.type === "numeric") {
          const analysis = analyzeNumeric(nestedValues, { key, label: humanize(key) });
          if (analysis) nestedInsights.push(analysis);
        } else if (typeInfo.type === "category") {
          const analysis = analyzeCategory(nestedValues, { key, label: humanize(key) });
          if (analysis) nestedInsights.push(analysis);
        }
      }
    }

    return {
      type: "array",
      column: column.key,
      label: column.label,
      stats: {
        avgLength: Stats.mean(lengths),
        minLength: Stats.min(lengths),
        maxLength: Stats.max(lengths),
        totalItems,
      },
      nested: nestedInsights,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Data Quality Analysis                                              */
  /* ------------------------------------------------------------------ */

  function analyzeDataQuality(rows, schema) {
    const issues = [];
    const totalRows = rows.length;

    // Check for missing values in each column
    for (const col of schema.columns) {
      if (col.type === "array") continue; // Skip arrays

      const values = rows.map(r => getValue(r, col.key));
      const missing = values.filter(v => v == null || v === "" || (typeof v === "string" && !v.trim())).length;
      const missingPercent = missing / totalRows;

      if (missingPercent > CONFIG.missingThreshold) {
        issues.push({
          type: "missing_values",
          column: col.key,
          label: col.label,
          count: missing,
          percent: missingPercent,
          // Filter: rows where this column is null/empty
          filter: { column: col.key, condition: "missing" },
        });
      }
    }

    // Check for duplicate rows (based on all text/id columns)
    const idCols = schema.columns.filter(c => c.semantic === "id" || c.key.toLowerCase().includes("id"));
    if (idCols.length > 0) {
      const primaryId = idCols[0];
      const seen = new Map();
      const duplicates = [];

      rows.forEach((row, idx) => {
        const val = getValue(row, primaryId.key);
        if (val != null) {
          if (seen.has(val)) {
            duplicates.push({ value: val, indices: [seen.get(val), idx] });
          } else {
            seen.set(val, idx);
          }
        }
      });

      if (duplicates.length > 0) {
        issues.push({
          type: "duplicates",
          column: primaryId.key,
          label: primaryId.label,
          count: duplicates.length,
          percent: duplicates.length / totalRows,
          examples: duplicates.slice(0, 3).map(d => d.value),
          filter: { column: primaryId.key, condition: "duplicate", values: duplicates.map(d => d.value) },
        });
      }
    }

    // Check data freshness (if datetime column exists)
    const dateCols = schema.columns.filter(c => c.type === "datetime");
    if (dateCols.length > 0) {
      const dateCol = dateCols[0];
      const dates = rows
        .map(r => getValue(r, dateCol.key))
        .filter(d => d != null)
        .map(d => parseDate(d))
        .filter(d => d && !isNaN(d.getTime()));

      if (dates.length > 0) {
        const latest = new Date(Math.max(...dates));
        const now = new Date();
        const daysSinceLatest = (now - latest) / (1000 * 60 * 60 * 24);

        if (daysSinceLatest > 7) {
          issues.push({
            type: "stale_data",
            column: dateCol.key,
            label: dateCol.label,
            latestDate: latest.toISOString().split("T")[0],
            daysSince: Math.round(daysSinceLatest),
          });
        }
      }
    }

    return issues;
  }

  /* ------------------------------------------------------------------ */
  /*  Aggregation Insights                                               */
  /* ------------------------------------------------------------------ */

  function generateAggregations(rows, schema, columnAnalysis) {
    const aggregations = [];

    // Sum totals for currency columns
    for (const col of schema.columns) {
      if (col.type === "numeric" && col.semantic === "currency") {
        const values = rows.map(r => getValue(r, col.key)).filter(isNumeric);
        if (values.length > 0) {
          const total = Stats.sum(values);
          aggregations.push({
            type: "total",
            column: col.key,
            label: col.label,
            value: total,
            count: values.length,
          });
        }
      }
    }

    // Count by category (top categories)
    for (const col of schema.columns) {
      if (col.type === "category" && col.semantic !== "id") {
        const analysis = columnAnalysis[col.key];
        if (analysis && analysis.distribution && analysis.distribution.length >= 2) {
          aggregations.push({
            type: "category_breakdown",
            column: col.key,
            label: col.label,
            distribution: analysis.distribution.slice(0, 5),
            total: rows.length,
          });
        }
      }
    }

    // Top/Bottom for numeric columns
    for (const col of schema.columns) {
      if (col.type === "numeric" && col.semantic !== "id") {
        const rowsWithValues = rows
          .map((r, idx) => ({ idx, value: getValue(r, col.key), row: r }))
          .filter(r => isNumeric(r.value))
          .sort((a, b) => b.value - a.value);

        if (rowsWithValues.length >= 5) {
          // Find a label column for display
          const labelCol = schema.columns.find(c =>
            c.type === "text" && !c.key.includes("id") && c.semantic !== "id"
          ) || schema.columns.find(c => c.semantic === "id");

          if (labelCol) {
            const top3 = rowsWithValues.slice(0, 3).map(r => ({
              label: getValue(r.row, labelCol.key),
              value: r.value,
              idx: r.idx,
            }));

            aggregations.push({
              type: "top_values",
              column: col.key,
              columnLabel: col.label,
              labelColumn: labelCol.key,
              items: top3,
              filter: { column: col.key, condition: "top", indices: top3.map(t => t.idx) },
            });
          }
        }
      }
    }

    return aggregations;
  }

  /* ------------------------------------------------------------------ */
  /*  Cross-Column Analysis                                              */
  /* ------------------------------------------------------------------ */

  function findCorrelations(rows, schema) {
    const numericCols = schema.columns.filter(c => c.type === "numeric" && c.semantic !== "id");
    const correlations = [];

    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const col1 = numericCols[i];
        const col2 = numericCols[j];

        // Get paired values (both must be non-null)
        const pairs = rows
          .map(r => [getValue(r, col1.key), getValue(r, col2.key)])
          .filter(([a, b]) => isNumeric(a) && isNumeric(b));

        if (pairs.length < 10) continue;

        const x = pairs.map(p => p[0]);
        const y = pairs.map(p => p[1]);
        const r = Stats.correlation(x, y);

        if (Math.abs(r) >= CONFIG.correlationThreshold) {
          correlations.push({
            col1: col1.key,
            col2: col2.key,
            label1: col1.label,
            label2: col2.label,
            r,
            strength: Math.abs(r) > 0.7 ? "strong" : "moderate",
            direction: r > 0 ? "positive" : "negative",
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }

  function findGroupInsights(rows, schema) {
    const categoryCols = schema.columns.filter(c => c.type === "category" && c.semantic !== "id");
    const numericCols = schema.columns.filter(c => c.type === "numeric" && c.semantic !== "id");
    const insights = [];

    for (const catCol of categoryCols.slice(0, 3)) {
      for (const numCol of numericCols.slice(0, 5)) {
        // Group by category
        const groups = {};
        for (const row of rows) {
          const cat = getValue(row, catCol.key);
          const num = getValue(row, numCol.key);
          if (cat == null || !isNumeric(num)) continue;

          const key = String(cat);
          if (!groups[key]) groups[key] = [];
          groups[key].push(num);
        }

        const groupStats = Object.entries(groups)
          .filter(([_, vals]) => vals.length >= 3)
          .map(([name, vals]) => ({
            name,
            mean: Stats.mean(vals),
            count: vals.length,
          }))
          .sort((a, b) => b.mean - a.mean);

        if (groupStats.length >= 2) {
          const top = groupStats[0];
          const bottom = groupStats[groupStats.length - 1];
          const diff = top.mean - bottom.mean;
          const avgMean = Stats.mean(groupStats.map(g => g.mean));

          if (avgMean !== 0 && Math.abs(diff / avgMean) > 0.2) {
            insights.push({
              type: "group_comparison",
              groupBy: catCol.key,
              groupByLabel: catCol.label,
              metric: numCol.key,
              metricLabel: numCol.label,
              top: { name: top.name, mean: top.mean },
              bottom: { name: bottom.name, mean: bottom.mean },
              diffPercent: diff / avgMean,
            });
          }
        }
      }
    }

    return insights;
  }

  /* ------------------------------------------------------------------ */
  /*  Insight Generation                                                 */
  /* ------------------------------------------------------------------ */

  function generateInsights(rows, options = {}) {
    const config = { ...CONFIG, ...options };

    if (!rows || !rows.length) {
      return { insights: [], schema: null, error: "No data provided" };
    }

    const sample = rows.slice(0, config.sampleSize);
    const schema = analyzeSchema(sample);
    const columnAnalysis = {};
    const rawInsights = [];

    // Analyze each column
    for (const col of schema.columns) {
      const values = sample.map(r => getValue(r, col.key));

      let analysis = null;
      switch (col.type) {
        case "numeric":
          analysis = analyzeNumeric(values, col);
          break;
        case "category":
          analysis = analyzeCategory(values, col);
          break;
        case "datetime":
          analysis = analyzeDatetime(values, col);
          break;
        case "boolean":
          analysis = analyzeBoolean(values, col);
          break;
        case "array":
          analysis = analyzeArray(values, col, sample);
          break;
      }

      if (analysis) {
        columnAnalysis[col.key] = analysis;

        // Generate insights from analysis
        if (analysis.type === "numeric" && analysis.outliers.count > 0) {
          rawInsights.push({
            type: "outliers",
            priority: 0.7 + Math.min(analysis.outliers.count / 10, 0.3),
            data: analysis,
            filter: { column: col.key, condition: "outlier", indices: analysis.outliers.indices },
          });
        }

        if (analysis.type === "numeric" && Math.abs(analysis.trend.percentChange) > config.trendThreshold) {
          rawInsights.push({
            type: "trend",
            priority: 0.5 + Math.min(Math.abs(analysis.trend.percentChange), 0.5),
            data: analysis,
          });
        }

        // High variation detection
        if (analysis.type === "numeric" && analysis.distribution.spread > config.variationThreshold) {
          rawInsights.push({
            type: "high_variation",
            priority: 0.4 + Math.min(analysis.distribution.spread, 0.4),
            data: analysis,
          });
        }

        // Distribution skew
        if (analysis.type === "numeric" && analysis.distribution.skew !== "symmetric") {
          const skewStrength = Math.abs(analysis.stats.mean - analysis.stats.median) / (analysis.stats.stdDev || 1);
          if (skewStrength > 0.3) {
            rawInsights.push({
              type: "skewed_distribution",
              priority: 0.35 + Math.min(skewStrength * 0.2, 0.3),
              data: analysis,
            });
          }
        }

        // Key statistics for important metrics
        if (analysis.type === "numeric" && col.semantic === "currency") {
          rawInsights.push({
            type: "metric_summary",
            priority: 0.5,
            data: analysis,
          });
        }

        if (analysis.type === "category" && analysis.rare.length > 0) {
          rawInsights.push({
            type: "rare_values",
            priority: 0.4,
            data: analysis,
          });
        }

        if (analysis.type === "datetime" && analysis.gaps.length > 0) {
          rawInsights.push({
            type: "data_gaps",
            priority: 0.6,
            data: analysis,
          });
        }

        if (analysis.type === "boolean" && (analysis.stats.truePercent > 0.9 || analysis.stats.truePercent < 0.1)) {
          rawInsights.push({
            type: "boolean_skew",
            priority: 0.5,
            data: analysis,
          });
        }

        // Nested array insights
        if (analysis.type === "array" && analysis.nested) {
          for (const nested of analysis.nested) {
            if (nested.type === "numeric" && nested.outliers && nested.outliers.count > 0) {
              rawInsights.push({
                type: "nested_outliers",
                priority: 0.6,
                data: { parent: analysis, nested },
              });
            }
          }
        }
      }
    }

    // Cross-column analysis
    const correlations = findCorrelations(sample, schema);
    for (const corr of correlations.slice(0, 3)) {
      rawInsights.push({
        type: "correlation",
        priority: 0.6 + Math.abs(corr.r) * 0.4,
        data: corr,
      });
    }

    const groupInsights = findGroupInsights(sample, schema);
    for (const gi of groupInsights.slice(0, 3)) {
      rawInsights.push({
        type: "group_comparison",
        priority: 0.5 + Math.min(Math.abs(gi.diffPercent), 0.5),
        data: gi,
        filter: { column: gi.groupBy, condition: "equals", value: gi.top.name },
      });
    }

    // Data quality insights
    const qualityIssues = analyzeDataQuality(sample, schema);
    for (const issue of qualityIssues) {
      rawInsights.push({
        type: issue.type,
        priority: issue.type === "duplicates" ? 0.9 : issue.type === "stale_data" ? 0.7 : 0.6,
        data: issue,
        filter: issue.filter || null,
      });
    }

    // Aggregation insights (high priority - users want to see totals)
    const aggregations = generateAggregations(sample, schema, columnAnalysis);
    for (const agg of aggregations) {
      if (agg.type === "total") {
        rawInsights.push({
          type: "aggregation_total",
          priority: 0.85,  // High priority - totals are important
          data: agg,
        });
      } else if (agg.type === "top_values") {
        rawInsights.push({
          type: "top_values",
          priority: 0.75,
          data: agg,
          filter: agg.filter,
        });
      } else if (agg.type === "category_breakdown") {
        rawInsights.push({
          type: "category_breakdown",
          priority: 0.7,
          data: agg,
          filter: { column: agg.column, condition: "equals", value: agg.distribution[0].value },
        });
      }
    }

    // Sort by priority and limit
    rawInsights.sort((a, b) => b.priority - a.priority);
    const topInsights = rawInsights.slice(0, config.maxInsights);

    // Generate narratives
    const insights = topInsights.map(ins => ({
      ...ins,
      narrative: generateNarrative(ins),
    }));

    return {
      insights,
      schema,
      columnAnalysis,
      summary: generateSummary(rows, schema, columnAnalysis),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Narrative Templates                                                */
  /* ------------------------------------------------------------------ */

  function generateNarrative(insight) {
    const { type, data } = insight;

    switch (type) {
      case "outliers":
        return `${data.label} has ${data.outliers.count} outlier${data.outliers.count > 1 ? "s" : ""} ` +
          `(values: ${data.outliers.values.slice(0, 3).map(v => formatNumber(v)).join(", ")}` +
          `${data.outliers.count > 3 ? "..." : ""})`;

      case "trend":
        const dir = data.trend.percentChange > 0 ? "increasing" : "decreasing";
        return `${data.label} is ${dir} (${formatPercent(Math.abs(data.trend.percentChange))} overall trend)`;

      case "correlation":
        return `${data.label1} and ${data.label2} are ${data.strength}ly ${data.direction} correlated (r=${data.r.toFixed(2)})`;

      case "group_comparison":
        return `${data.metricLabel} varies by ${data.groupByLabel}: "${data.top.name}" averages ${formatNumber(data.top.mean)} ` +
          `vs "${data.bottom.name}" at ${formatNumber(data.bottom.mean)} (${formatPercent(Math.abs(data.diffPercent))} difference)`;

      case "rare_values":
        const rareList = data.rare.slice(0, 3).map(r => `"${r.value}"`).join(", ");
        return `${data.label} has rare values: ${rareList}`;

      case "data_gaps":
        const gap = data.gaps[0];
        return `${data.label} has data gaps: ${gap.days} days missing between ${gap.start} and ${gap.end}`;

      case "boolean_skew":
        const pct = data.stats.truePercent > 0.5 ? data.stats.truePercent : data.stats.falsePercent;
        const which = data.stats.truePercent > 0.5 ? "true" : "false";
        return `${data.label} is ${formatPercent(pct)} ${which}`;

      case "nested_outliers":
        return `${data.parent.label} contains items with unusual ${data.nested.label} values`;

      case "high_variation":
        return `${data.label} shows high variation (CV=${formatPercent(data.distribution.spread)}): ` +
          `ranges from ${formatNumber(data.stats.min)} to ${formatNumber(data.stats.max)}`;

      case "skewed_distribution":
        return `${data.label} is ${data.distribution.skew}-skewed: ` +
          `median ${formatNumber(data.stats.median)} vs mean ${formatNumber(data.stats.mean)}`;

      case "metric_summary":
        return `${data.label}: avg ${formatNumber(data.stats.mean)}, ` +
          `range ${formatNumber(data.stats.min)}–${formatNumber(data.stats.max)}`;

      // Data quality
      case "missing_values":
        return `${data.label} has ${data.count} missing value${data.count > 1 ? "s" : ""} (${formatPercent(data.percent)})`;

      case "duplicates":
        return `Found ${data.count} duplicate${data.count > 1 ? "s" : ""} in ${data.label}` +
          (data.examples ? `: ${data.examples.slice(0, 2).join(", ")}${data.count > 2 ? "..." : ""}` : "");

      case "stale_data":
        return `Data may be stale: latest ${data.label} is ${data.latestDate} (${data.daysSince} days ago)`;

      // Aggregations
      case "aggregation_total":
        return `Total ${data.label}: ${formatNumber(data.value)} across ${data.count} records`;

      case "top_values":
        const topItems = data.items.slice(0, 3).map(i => `${i.label} (${formatNumber(i.value)})`).join(", ");
        return `Top ${data.columnLabel}: ${topItems}`;

      case "category_breakdown":
        const top2 = data.distribution.slice(0, 2);
        return `${data.label}: ${top2.map(d => `${d.value} ${formatPercent(d.percent)}`).join(", ")}` +
          (data.distribution.length > 2 ? ` +${data.distribution.length - 2} more` : "");

      default:
        return "Pattern detected";
    }
  }

  function generateSummary(rows, schema, columnAnalysis) {
    const numericCols = Object.values(columnAnalysis).filter(a => a.type === "numeric");
    const categoryCols = Object.values(columnAnalysis).filter(a => a.type === "category");
    const dateCols = Object.values(columnAnalysis).filter(a => a.type === "datetime");

    const parts = [`Analyzed ${rows.length} records with ${schema.columns.length} fields.`];

    if (numericCols.length) {
      parts.push(`${numericCols.length} numeric field${numericCols.length > 1 ? "s" : ""}.`);
    }

    if (categoryCols.length) {
      const totalUnique = categoryCols.reduce((sum, c) => sum + c.stats.unique, 0);
      parts.push(`${categoryCols.length} categorical field${categoryCols.length > 1 ? "s" : ""} with ${totalUnique} unique values.`);
    }

    if (dateCols.length && dateCols[0].stats) {
      const dc = dateCols[0];
      parts.push(`Data spans ${dc.stats.rangeDays} days (${dc.stats.earliest} to ${dc.stats.latest}).`);
    }

    return parts.join(" ");
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  return {
    analyze: generateInsights,
    analyzeSchema,
    Stats,
    CONFIG,

    // Convenience method for datatable integration
    fromDatatable(widget) {
      if (!widget._dt || !widget._dt.allRows) {
        return { insights: [], error: "No data loaded in datatable" };
      }
      return generateInsights(widget._dt.allRows);
    },
  };
})();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ThinkInsights;
}
