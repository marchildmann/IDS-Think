/**
 * IDS-Think — Datatable Enhancement
 * Adds fetch, sort, filter, and limit to [data-datatable] widgets.
 * Supports both explicit { columns, rows } and auto-detected JSON formats.
 * Recursively flattens nested objects and summarises nested arrays.
 * Includes virtual scrolling for large datasets and sticky thead.
 * Keeps think.js untouched — this is a standalone add-on.
 */
(() => {
  const widgets = document.querySelectorAll("[data-datatable]");
  if (!widgets.length) return;

  /* ------------------------------------------------------------------ */
  /*  Formatting helpers                                                 */
  /* ------------------------------------------------------------------ */

  var CURRENCY_KEYS = ["amount", "total", "price", "cost", "revenue", "subtotal", "balance", "tax", "shipping"];

  function formatCurrency(n) {
    return "$" + Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatNumber(n) {
    return Number(n).toLocaleString("en-US");
  }

  function formatDate(iso) {
    if (!iso) return "\u2014";
    // Normalise "2026-01-19 23:49:04" → "2026-01-19T23:49:04"
    var normalized = String(iso).replace(" ", "T");
    if (normalized.length === 10) normalized += "T00:00:00";
    var d = new Date(normalized);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /* Convert snake_case to Title Case for display. */
  function humanize(str) {
    return String(str).replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* Normalize a status value to "badge:Label" format. */
  function normalizeStatus(value) {
    if (value == null) return "inactive:\u2014";
    var str = String(value);
    if (str.indexOf(":") !== -1) return str; // already formatted

    var label = humanize(str);
    var lower = str.toLowerCase();
    if (["delivered", "completed", "active", "paid", "fulfilled", "online", "open", "enabled"].indexOf(lower) !== -1) return "active:" + label;
    if (["cancelled", "refunded", "inactive", "failed", "returned", "offline", "closed", "error", "disabled"].indexOf(lower) !== -1) return "inactive:" + label;
    return "pending:" + label;
  }

  /* Resolve a dot-notation key path on a row object. */
  function getValue(row, keyPath) {
    var parts = keyPath.split(".");
    var val = row;
    for (var i = 0; i < parts.length; i++) {
      if (val == null) return null;
      val = val[parts[i]];
    }
    return val;
  }

  /* Return the display text for a cell (used by filter). */
  function displayValue(col, value) {
    if (value == null) return "\u2014";
    if (col.type === "numeric") return col.currency ? formatCurrency(value) : formatNumber(value);
    if (col.type === "date") return formatDate(value);
    if (col.type === "status") return normalizeStatus(value).split(":")[1] || String(value);
    if (col.type === "boolean") return value ? "Yes" : "No";
    if (col.type === "array") {
      if (!Array.isArray(value) || !value.length) return "\u2014";
      return value.length + (value.length === 1 ? " item" : " items");
    }
    // Text — humanize snake_case values
    var s = String(value);
    if (/^[a-z]+(_[a-z0-9]+)+$/.test(s)) return humanize(s);
    return s;
  }

  /* ------------------------------------------------------------------ */
  /*  Auto-detection: flexible JSON support                              */
  /* ------------------------------------------------------------------ */

  function detectColType(fieldName, rows, keyPath) {
    // Sample up to 5 non-null values to determine type
    var sample = null;
    for (var i = 0; i < Math.min(rows.length, 5); i++) {
      var v = getValue(rows[i], keyPath);
      if (v != null) { sample = v; break; }
    }
    var nameLower = fieldName.toLowerCase();
    if (nameLower === "status" || /_status$/.test(nameLower)) return { type: "status", currency: false };
    if (typeof sample === "boolean") return { type: "boolean", currency: false };
    if (Array.isArray(sample)) return { type: "array", currency: false };
    if (typeof sample === "number") {
      return { type: "numeric", currency: CURRENCY_KEYS.indexOf(nameLower) !== -1 };
    }
    if (typeof sample === "string" && /^\d{4}-\d{2}-\d{2}/.test(sample)) return { type: "date", currency: false };
    return { type: "text", currency: false };
  }

  /* Recursively flatten an object into column definitions. */
  function flattenKeys(obj, rows, prefix, cols) {
    Object.keys(obj).forEach(function (key) {
      var val = obj[key];
      var fullKey = prefix ? prefix + "." + key : key;

      if (Array.isArray(val)) {
        cols.push({ key: fullKey, label: humanize(key), type: "array", currency: false });
      } else if (val !== null && typeof val === "object") {
        // Recurse into nested objects
        flattenKeys(val, rows, fullKey, cols);
      } else {
        var info = detectColType(key, rows, fullKey);
        cols.push({ key: fullKey, label: humanize(key), type: info.type, currency: info.currency });
      }
    });
  }

  function autoColumns(rows) {
    var cols = [];
    flattenKeys(rows[0], rows, "", cols);
    return cols;
  }

  function parseData(data) {
    // Explicit format: { columns, rows }
    if (Array.isArray(data.columns) && Array.isArray(data.rows)) {
      data.columns.forEach(function (col) {
        if (col.type === "numeric" && col.currency === undefined) col.currency = true;
      });
      return { columns: data.columns, rows: data.rows };
    }

    // Auto-detect: find first array property with objects inside
    for (var key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === "object") {
        return { columns: autoColumns(data[key]), rows: data[key] };
      }
    }

    // Top-level array
    if (Array.isArray(data) && data.length > 0) {
      return { columns: autoColumns(data), rows: data };
    }

    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  Pipeline: filter → sort → limit                                    */
  /* ------------------------------------------------------------------ */

  function filterRows(rows, columns, query) {
    if (!query) return rows;
    var q = query.toLowerCase();
    return rows.filter(function (row) {
      return columns.some(function (col) {
        var val = getValue(row, col.key);
        if (val == null) return false;
        var raw = String(val).toLowerCase();
        var display = displayValue(col, val).toLowerCase();
        return display.indexOf(q) !== -1 || raw.indexOf(q) !== -1;
      });
    });
  }

  function sortRows(rows, key, dir, type) {
    if (!key) return rows;
    var sorted = rows.slice();
    var m = dir === "desc" ? -1 : 1;

    sorted.sort(function (a, b) {
      var va = getValue(a, key);
      var vb = getValue(b, key);

      // Nulls last
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      if (type === "numeric") return (va - vb) * m;
      if (type === "date") return (new Date(String(va).replace(" ", "T")) - new Date(String(vb).replace(" ", "T"))) * m;
      if (type === "boolean") return (va === vb ? 0 : va ? -1 : 1) * m;
      if (type === "array") return ((va.length || 0) - (vb.length || 0)) * m;

      // text and status — compare as strings
      var sa = type === "status" ? (normalizeStatus(va).split(":")[1] || String(va)) : String(va);
      var sb = type === "status" ? (normalizeStatus(vb).split(":")[1] || String(vb)) : String(vb);
      return sa.localeCompare(sb) * m;
    });

    return sorted;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering helpers                                                  */
  /* ------------------------------------------------------------------ */

  function renderCell(col, value) {
    if (value == null) return '<span data-text="muted">\u2014</span>';
    if (col.type === "status") {
      var parts = normalizeStatus(value).split(":");
      return '<span data-status="' + parts[0] + '">' + parts[1] + "</span>";
    }
    return displayValue(col, value);
  }

  function cellAttrs(col) {
    var attrs = ' data-label="' + col.label + '"';
    if (col.type === "numeric") attrs += ' data-text="mono"';
    if (col.type === "date") attrs += ' data-text="muted"';
    return attrs;
  }

  function renderThead(columns) {
    var html = "<thead><tr>";
    columns.forEach(function (col) {
      html += "<th data-sort data-col-key=\"" + col.key + "\">" + col.label + "</th>";
    });
    html += "</tr></thead>";
    return html;
  }

  function renderTbody(columns, rows) {
    var html = "<tbody>";
    rows.forEach(function (row) {
      html += "<tr>";
      columns.forEach(function (col) {
        html += "<td" + cellAttrs(col) + ">" + renderCell(col, getValue(row, col.key)) + "</td>";
      });
      html += "</tr>";
    });
    if (!rows.length) {
      html += '<tr><td colspan="' + columns.length + '" style="text-align:center;padding:var(--space-3);color:var(--text-2)">No matching records</td></tr>';
    }
    html += "</tbody>";
    return html;
  }

  function renderRowsHtml(columns, rows) {
    var html = "";
    rows.forEach(function (row) {
      html += "<tr>";
      columns.forEach(function (col) {
        html += "<td" + cellAttrs(col) + ">" + renderCell(col, getValue(row, col.key)) + "</td>";
      });
      html += "</tr>";
    });
    return html;
  }

  /* ------------------------------------------------------------------ */
  /*  Sort column marker (extracted for reuse)                           */
  /* ------------------------------------------------------------------ */

  function markSortColumn(widget, table) {
    var s = widget._dt;
    if (s.sortKey) {
      var th = table.querySelector('th[data-col-key="' + s.sortKey + '"]');
      if (th) {
        th.setAttribute("data-sort", s.sortDir);
        th.setAttribute("aria-sort", s.sortDir === "asc" ? "ascending" : "descending");
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Viewport height                                                    */
  /* ------------------------------------------------------------------ */

  function setupViewportHeight(widget) {
    var rect = widget.getBoundingClientRect();
    var available = window.innerHeight - rect.top - 16;
    var minH = 320; // ~20rem
    widget.style.height = Math.max(available, minH) + "px";
  }

  /* ------------------------------------------------------------------ */
  /*  Virtual scroll helpers                                             */
  /* ------------------------------------------------------------------ */

  function measureRowHeight(widget) {
    var row = widget.querySelector("tbody tr:not([data-vs-spacer])");
    if (!row) return 38; // fallback
    return row.getBoundingClientRect().height || 38;
  }

  function isCardLayout(widget) {
    var contentDiv = widget.querySelector(":scope > .datatable-body > div:first-child");
    return contentDiv && contentDiv.clientWidth < 448;
  }

  function shouldVirtualScroll(widget, rowCount) {
    if (isCardLayout(widget)) return false;
    if (rowCount <= 50) return false;
    if (!widget._dt.vs.rowHeight) return false;
    return true;
  }

  /* ------------------------------------------------------------------ */
  /*  Full render (standard path for small datasets / first render)      */
  /* ------------------------------------------------------------------ */

  function renderFull(widget, table, rows) {
    var s = widget._dt;
    s.vs.enabled = false;

    table.innerHTML = renderThead(s.columns) + renderTbody(s.columns, rows);
    markSortColumn(widget, table);
    bindSortHeaders(widget);

    // Measure row height after first paint for future virtual scrolls
    if (!s.vs.rowHeight && rows.length > 0) {
      requestAnimationFrame(function () {
        s.vs.rowHeight = measureRowHeight(widget);
        // If we now qualify for virtual scroll, re-render
        if (shouldVirtualScroll(widget, s.vs.displayRows.length)) {
          renderVirtual(widget, table, s.vs.displayRows);
        }
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Virtual render (windowed path for large datasets)                  */
  /* ------------------------------------------------------------------ */

  function renderVirtual(widget, table, rows) {
    var s = widget._dt;
    var vs = s.vs;
    vs.enabled = true;

    var contentDiv = widget.querySelector(":scope > .datatable-body > div:first-child");
    var viewportHeight = contentDiv.clientHeight;
    var rowHeight = vs.rowHeight;

    vs.visibleCount = Math.ceil(viewportHeight / rowHeight);

    var scrollTop = contentDiv.scrollTop;
    var rawStart = Math.floor(scrollTop / rowHeight);
    var start = Math.max(0, rawStart - vs.bufferCount);
    var end = Math.min(rows.length, rawStart + vs.visibleCount + vs.bufferCount);

    vs.startIndex = start;
    vs.endIndex = end;

    var topH = start * rowHeight;
    var bottomH = Math.max(0, (rows.length - end) * rowHeight);
    var colCount = s.columns.length;

    var tbody = "<tbody>";
    if (topH > 0) {
      tbody += '<tr data-vs-spacer><td colspan="' + colCount + '" style="height:' + topH + 'px"></td></tr>';
    }
    tbody += renderRowsHtml(s.columns, rows.slice(start, end));
    if (bottomH > 0) {
      tbody += '<tr data-vs-spacer><td colspan="' + colCount + '" style="height:' + bottomH + 'px"></td></tr>';
    }
    tbody += "</tbody>";

    table.innerHTML = renderThead(s.columns) + tbody;
    markSortColumn(widget, table);
    bindSortHeaders(widget);
  }

  /* Optimised scroll-driven update — only replaces tbody, preserves thead */
  function renderVirtualUpdate(widget) {
    var s = widget._dt;
    var vs = s.vs;
    if (!vs.enabled) return;

    var rows = vs.displayRows;
    var table = widget.querySelector("table");
    var tbody = table.querySelector("tbody");
    var contentDiv = widget.querySelector(":scope > .datatable-body > div:first-child");

    var scrollTop = contentDiv.scrollTop;
    var rowHeight = vs.rowHeight;

    var rawStart = Math.floor(scrollTop / rowHeight);
    var start = Math.max(0, rawStart - vs.bufferCount);
    var end = Math.min(rows.length, rawStart + vs.visibleCount + vs.bufferCount);

    // Skip if the visible window hasn't shifted
    if (start === vs.startIndex && end === vs.endIndex) return;

    vs.startIndex = start;
    vs.endIndex = end;

    var topH = start * rowHeight;
    var bottomH = Math.max(0, (rows.length - end) * rowHeight);
    var colCount = s.columns.length;

    var html = "";
    if (topH > 0) {
      html += '<tr data-vs-spacer><td colspan="' + colCount + '" style="height:' + topH + 'px"></td></tr>';
    }
    html += renderRowsHtml(s.columns, rows.slice(start, end));
    if (bottomH > 0) {
      html += '<tr data-vs-spacer><td colspan="' + colCount + '" style="height:' + bottomH + 'px"></td></tr>';
    }

    tbody.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /*  Main render — applies full pipeline and routes to render path      */
  /* ------------------------------------------------------------------ */

  function render(widget) {
    var s = widget._dt;
    var table = widget.querySelector("table");
    var footer = widget.querySelector("footer");

    // Pipeline
    var filtered = filterRows(s.allRows, s.columns, s.filterQuery);
    var sorted = sortRows(filtered, s.sortKey, s.sortDir, s.sortType);
    var limited = sorted.slice(0, s.limit);

    // Store for virtual scroll
    s.vs.displayRows = limited;

    // Reset scroll position on data change
    var contentDiv = widget.querySelector(":scope > .datatable-body > div:first-child");
    if (contentDiv) contentDiv.scrollTop = 0;
    s.vs.startIndex = -1;
    s.vs.endIndex = -1;

    // Footer
    if (footer) {
      var total = filtered.length;
      var shown = limited.length;
      footer.textContent = "Showing " + shown + " of " + total + " records";
    }

    // Route to appropriate render path
    if (shouldVirtualScroll(widget, limited.length)) {
      renderVirtual(widget, table, limited);
    } else {
      renderFull(widget, table, limited);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Event binding                                                      */
  /* ------------------------------------------------------------------ */

  function bindSortHeaders(widget) {
    var headers = widget.querySelectorAll("th[data-sort]");
    headers.forEach(function (th) {
      th.addEventListener("click", function () {
        var key = th.getAttribute("data-col-key");
        var s = widget._dt;

        if (s.sortKey === key) {
          s.sortDir = s.sortDir === "asc" ? "desc" : "asc";
        } else {
          s.sortKey = key;
          s.sortDir = "asc";
          // Look up type from columns
          var col = s.columns.find(function (c) { return c.key === key; });
          s.sortType = col ? col.type : "text";
        }

        render(widget);
      });
    });
  }

  function bindControls(widget) {
    var filterInput = widget.querySelector("[data-datatable-filter]");
    var limitSelect = widget.querySelector("[data-datatable-limit]");
    var exportBtn = widget.querySelector("[data-datatable-export]");
    var urlInput = widget.querySelector("[data-datatable-url]");
    var urlLoadBtn = widget.querySelector("[data-datatable-url-load]");

    if (filterInput) {
      filterInput.addEventListener("input", function () {
        widget._dt.filterQuery = this.value;
        // Clear any insight filter when manually filtering
        if (widget._dt.insightFilterActive) {
          clearInsightFilter(widget);
        } else {
          render(widget);
        }
        // Re-run insights if panel is open
        refreshInsightsIfOpen(widget);
      });
    }

    if (limitSelect) {
      limitSelect.addEventListener("change", function () {
        widget._dt.limit = parseInt(this.value, 10) || 10;
        render(widget);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        alert("Export will be available soon.");
      });
    }

    // Insights button
    var insightsBtn = widget.querySelector("[data-datatable-insights-btn]");
    var insightsPanel = widget.querySelector("[data-datatable-insights]");
    if (insightsBtn && insightsPanel) {
      insightsBtn.addEventListener("click", function () {
        var isOpen = insightsBtn.getAttribute("aria-pressed") === "true";
        if (isOpen) {
          insightsBtn.setAttribute("aria-pressed", "false");
          insightsPanel.removeAttribute("data-visible");
        } else {
          insightsBtn.setAttribute("aria-pressed", "true");
          insightsPanel.setAttribute("data-visible", "");
          renderInsights(widget);
        }
      });
    }

    if (urlInput) {
      if (urlLoadBtn) {
        urlLoadBtn.addEventListener("click", function () {
          var url = urlInput.value.trim();
          if (url) loadUrl(widget, url);
        });
      }
      urlInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var url = urlInput.value.trim();
          if (url) loadUrl(widget, url);
        }
      });
    }
  }

  function bindScrollHandler(widget) {
    var contentDiv = widget.querySelector(":scope > .datatable-body > div:first-child");
    if (!contentDiv) return;

    contentDiv.addEventListener("scroll", function () {
      var vs = widget._dt.vs;
      if (!vs.enabled || vs._rafPending) return;

      vs._rafPending = true;
      requestAnimationFrame(function () {
        vs._rafPending = false;
        renderVirtualUpdate(widget);
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /*  Load URL — fetch JSON and populate the table                       */
  /* ------------------------------------------------------------------ */

  function isJsonlUrl(url) {
    try {
      var pathname = new URL(url, location.href).pathname;
      return /\.jsonl$/i.test(pathname);
    } catch (_) {
      return /\.jsonl$/i.test(url.split("?")[0]);
    }
  }

  function parseJsonl(text) {
    var rows = [];
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      rows.push(JSON.parse(line));
    }
    return rows;
  }

  function loadUrl(widget, url) {
    var footer = widget.querySelector("footer");
    if (footer) footer.textContent = "Loading\u2026";

    var jsonl = isJsonlUrl(url);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return jsonl ? res.text() : res.json();
      })
      .then(function (raw) {
        var data = jsonl ? parseJsonl(raw) : raw;
        var parsed = parseData(data);
        if (!parsed) {
          if (footer) footer.textContent = "Could not detect rows in " + (jsonl ? "JSONL" : "JSON");
          console.warn("Datatable: could not detect rows from", url);
          return;
        }

        // Reset state with new data
        widget._dt.columns = parsed.columns;
        widget._dt.allRows = parsed.rows;
        widget._dt.filterQuery = "";
        widget._dt.sortKey = null;
        widget._dt.sortDir = "asc";
        widget._dt.sortType = "text";

        // Force row height re-measurement for new columns
        widget._dt.vs.rowHeight = 0;

        // Clear the filter input
        var filterInput = widget.querySelector("[data-datatable-filter]");
        if (filterInput) filterInput.value = "";

        // Read current limit from the select
        var limitSelect = widget.querySelector("[data-datatable-limit]");
        if (limitSelect) {
          widget._dt.limit = parseInt(limitSelect.value, 10) || 10;
        }

        render(widget);
      })
      .catch(function (err) {
        if (footer) footer.textContent = "Failed to load: " + err.message;
        console.warn("Datatable fetch failed:", url, err);
      });
  }

  /* ------------------------------------------------------------------ */
  /*  Insights rendering                                                 */
  /* ------------------------------------------------------------------ */

  // Debounce timer for insight refresh
  var insightRefreshTimer = null;

  function refreshInsightsIfOpen(widget) {
    var insightsBtn = widget.querySelector("[data-datatable-insights-btn]");
    if (insightsBtn && insightsBtn.getAttribute("aria-pressed") === "true") {
      // Debounce to avoid re-running on every keystroke
      clearTimeout(insightRefreshTimer);
      insightRefreshTimer = setTimeout(function () {
        renderInsights(widget);
      }, 300);
    }
  }

  function renderInsights(widget) {
    var panel = widget.querySelector("[data-datatable-insights]");
    var list = panel.querySelector("ul");
    var summary = panel.querySelector(".insight-summary");
    var header = panel.querySelector("summary");

    if (!widget._dt || !widget._dt.allRows || !widget._dt.allRows.length) {
      list.innerHTML = '<li><span class="insight-text">No data loaded</span></li>';
      summary.textContent = "";
      return;
    }

    // Check if ThinkInsights is available
    if (typeof ThinkInsights === "undefined") {
      list.innerHTML = '<li><span class="insight-text">Insights engine not loaded</span></li>';
      summary.textContent = "";
      return;
    }

    // Determine which rows to analyze: filtered or all
    var rowsToAnalyze = widget._dt.allRows;
    var isFiltered = false;

    if (widget._dt.filterQuery && widget._dt.filterQuery.trim()) {
      // Apply the same filter as the table display
      rowsToAnalyze = filterRows(widget._dt.allRows, widget._dt.columns, widget._dt.filterQuery);
      isFiltered = true;
    }

    // Update header to show filter status
    if (header) {
      header.textContent = isFiltered
        ? "Insights (" + rowsToAnalyze.length + " filtered)"
        : "Data Insights";
    }

    if (rowsToAnalyze.length === 0) {
      list.innerHTML = '<li><span class="insight-text">No matching records to analyze</span></li>';
      summary.textContent = "";
      return;
    }

    // Generate insights on the relevant data
    var result = ThinkInsights.analyze(rowsToAnalyze);

    if (!result.insights || !result.insights.length) {
      list.innerHTML = '<li><span class="insight-text">No significant patterns found</span></li>';
      summary.textContent = result.summary || "";
      return;
    }

    // Store insights for click handling
    widget._dt.insights = result.insights;

    // Render insight list
    var html = "";
    result.insights.forEach(function (insight, idx) {
      var hasFilter = insight.filter ? ' data-clickable' : '';
      html += '<li data-type="' + insight.type + '" data-insight-idx="' + idx + '"' + hasFilter + '>';
      html += '<span class="insight-text">' + insight.narrative + '</span>';
      if (insight.filter) {
        html += '<span class="insight-filter-hint">Click to filter</span>';
      }
      html += '</li>';
    });
    list.innerHTML = html;
    summary.textContent = result.summary || "";

    // Bind click handlers for filterable insights
    list.querySelectorAll("li[data-clickable]").forEach(function (li) {
      li.addEventListener("click", function () {
        var idx = parseInt(li.getAttribute("data-insight-idx"), 10);
        var insight = widget._dt.insights[idx];
        if (insight && insight.filter) {
          applyInsightFilter(widget, insight.filter, li);
        }
      });
    });
  }

  function applyInsightFilter(widget, filter, clickedLi) {
    var s = widget._dt;
    var panel = widget.querySelector("[data-datatable-insights]");
    var allLis = panel.querySelectorAll("li[data-clickable]");

    // If this filter is already active, clear it
    if (clickedLi.hasAttribute("data-active-filter")) {
      clearInsightFilter(widget);
      return;
    }

    // Clear any previous active filter
    allLis.forEach(function (li) { li.removeAttribute("data-active-filter"); });

    // Mark this one as active
    clickedLi.setAttribute("data-active-filter", "");

    // Determine base rows: if text filter is active, use filtered rows
    var baseRows = s.allRows;
    if (s.filterQuery && s.filterQuery.trim()) {
      baseRows = filterRows(s.allRows, s.columns, s.filterQuery);
    }

    // Build filter based on condition type
    if (filter.condition === "outlier" && filter.indices) {
      // Show only rows at specific indices (relative to baseRows)
      var indexSet = new Set(filter.indices);
      s.insightFilteredRows = baseRows.filter(function (_, idx) {
        return indexSet.has(idx);
      });
    } else if (filter.condition === "equals" && filter.value !== undefined) {
      // Show rows where column equals value
      s.insightFilteredRows = baseRows.filter(function (row) {
        return getValue(row, filter.column) === filter.value;
      });
    } else if (filter.condition === "missing") {
      // Show rows where column is null/empty
      s.insightFilteredRows = baseRows.filter(function (row) {
        var val = getValue(row, filter.column);
        return val == null || val === "" || (typeof val === "string" && !val.trim());
      });
    } else if (filter.condition === "duplicate" && filter.values) {
      // Show rows with duplicate values
      var dupSet = new Set(filter.values);
      s.insightFilteredRows = baseRows.filter(function (row) {
        return dupSet.has(getValue(row, filter.column));
      });
    } else if (filter.condition === "top" && filter.indices) {
      var topSet = new Set(filter.indices);
      s.insightFilteredRows = baseRows.filter(function (_, idx) {
        return topSet.has(idx);
      });
    } else {
      // Fallback: no filter
      s.insightFilteredRows = null;
      return;
    }

    // Store original rows and apply filter
    s.insightFilterActive = true;

    // Re-render with filtered data
    renderWithInsightFilter(widget);
  }

  function clearInsightFilter(widget) {
    var s = widget._dt;
    var panel = widget.querySelector("[data-datatable-insights]");

    // Clear active state from all insights
    panel.querySelectorAll("li[data-active-filter]").forEach(function (li) {
      li.removeAttribute("data-active-filter");
    });

    s.insightFilterActive = false;
    s.insightFilteredRows = null;

    // Re-render with all data
    render(widget);
  }

  function renderWithInsightFilter(widget) {
    var s = widget._dt;
    var table = widget.querySelector("table");
    var footer = widget.querySelector("footer");

    if (!s.insightFilteredRows) {
      render(widget);
      return;
    }

    var filtered = filterRows(s.insightFilteredRows, s.columns, s.filterQuery);
    var sorted = sortRows(filtered, s.sortKey, s.sortDir, s.sortType);
    var limited = sorted.slice(0, s.limit);

    s.vs.displayRows = limited;

    var contentDiv = widget.querySelector(":scope > .datatable-body > div:first-child");
    if (contentDiv) contentDiv.scrollTop = 0;

    if (footer) {
      footer.textContent = "Filtered: " + limited.length + " of " + s.insightFilteredRows.length + " matching records (click insight to clear)";
    }

    // Render rows
    if (shouldVirtualScroll(widget, limited.length)) {
      renderVirtual(widget, table, limited);
    } else {
      renderFull(widget, table, limited);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Init                                                               */
  /* ------------------------------------------------------------------ */

  function init(widget) {
    var src = widget.getAttribute("data-src");
    if (!src) return;

    // Initialise default state so controls can bind
    widget._dt = {
      columns: [],
      allRows: [],
      filterQuery: "",
      sortKey: null,
      sortDir: "asc",
      sortType: "text",
      limit: 10,
      vs: {
        enabled: false,
        rowHeight: 0,
        visibleCount: 0,
        bufferCount: 5,
        startIndex: -1,
        endIndex: -1,
        displayRows: [],
        _rafPending: false,
      },
    };

    // Read initial limit from the select if present
    var limitSelect = widget.querySelector("[data-datatable-limit]");
    if (limitSelect) {
      widget._dt.limit = parseInt(limitSelect.value, 10) || 10;
    }

    bindControls(widget);
    bindScrollHandler(widget);
    loadUrl(widget, src);

    // Set viewport-filling height after first paint
    requestAnimationFrame(function () {
      setupViewportHeight(widget);
    });

    // Recalculate on resize (debounced)
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        setupViewportHeight(widget);
        // Row height may change if density changed
        widget._dt.vs.rowHeight = 0;
        render(widget);
      }, 150);
    });
  }

  // Boot all datatable widgets
  widgets.forEach(init);
})();
