/**
 * IDS-Think — Datatable Enhancement
 * Adds fetch, sort, filter, and limit to [data-datatable] widgets.
 * Supports both explicit { columns, rows } and auto-detected JSON formats.
 * Recursively flattens nested objects and summarises nested arrays.
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
  /*  Rendering                                                          */
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

  /* ------------------------------------------------------------------ */
  /*  Main render — applies full pipeline and updates DOM                */
  /* ------------------------------------------------------------------ */

  function render(widget) {
    var s = widget._dt;
    var table = widget.querySelector("table");
    var footer = widget.querySelector("footer");

    // Pipeline
    var filtered = filterRows(s.allRows, s.columns, s.filterQuery);
    var sorted = sortRows(filtered, s.sortKey, s.sortDir, s.sortType);
    var limited = sorted.slice(0, s.limit);

    // Rebuild table
    table.innerHTML = renderThead(s.columns) + renderTbody(s.columns, limited);

    // Mark active sort column
    if (s.sortKey) {
      var th = table.querySelector('th[data-col-key="' + s.sortKey + '"]');
      if (th) {
        th.setAttribute("data-sort", s.sortDir);
        th.setAttribute("aria-sort", s.sortDir === "asc" ? "ascending" : "descending");
      }
    }

    // Footer
    if (footer) {
      var total = filtered.length;
      var shown = limited.length;
      footer.textContent = "Showing " + shown + " of " + total + " records";
    }

    // Re-bind sort click handlers on new thead
    bindSortHeaders(widget);
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
        render(widget);
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

  /* ------------------------------------------------------------------ */
  /*  Load URL — fetch JSON and populate the table                       */
  /* ------------------------------------------------------------------ */

  function loadUrl(widget, url) {
    var footer = widget.querySelector("footer");
    if (footer) footer.textContent = "Loading\u2026";

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var parsed = parseData(data);
        if (!parsed) {
          if (footer) footer.textContent = "Could not detect rows in JSON";
          console.warn("Datatable: could not detect rows in JSON from", url);
          return;
        }

        // Reset state with new data
        widget._dt.columns = parsed.columns;
        widget._dt.allRows = parsed.rows;
        widget._dt.filterQuery = "";
        widget._dt.sortKey = null;
        widget._dt.sortDir = "asc";
        widget._dt.sortType = "text";

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
    };

    // Read initial limit from the select if present
    var limitSelect = widget.querySelector("[data-datatable-limit]");
    if (limitSelect) {
      widget._dt.limit = parseInt(limitSelect.value, 10) || 10;
    }

    bindControls(widget);
    loadUrl(widget, src);
  }

  // Boot all datatable widgets
  widgets.forEach(init);
})();
