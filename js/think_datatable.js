/**
 * IDS-Think — Datatable Enhancement
 * Adds fetch, sort, filter, and limit to [data-datatable] widgets.
 * Keeps think.js untouched — this is a standalone add-on.
 */
(() => {
  const widgets = document.querySelectorAll("[data-datatable]");
  if (!widgets.length) return;

  /* ------------------------------------------------------------------ */
  /*  Formatting helpers                                                 */
  /* ------------------------------------------------------------------ */

  function formatCurrency(n) {
    return "$" + Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /* Return the display text for a cell (used by filter). */
  function displayValue(col, value) {
    if (col.type === "numeric") return formatCurrency(value);
    if (col.type === "date") return formatDate(value);
    if (col.type === "status") return value.split(":")[1] || value;
    return String(value);
  }

  /* ------------------------------------------------------------------ */
  /*  Pipeline: filter → sort → limit                                    */
  /* ------------------------------------------------------------------ */

  function filterRows(rows, columns, query) {
    if (!query) return rows;
    var q = query.toLowerCase();
    return rows.filter(function (row) {
      return columns.some(function (col) {
        var raw = String(row[col.key]).toLowerCase();
        var display = displayValue(col, row[col.key]).toLowerCase();
        return display.indexOf(q) !== -1 || raw.indexOf(q) !== -1;
      });
    });
  }

  function sortRows(rows, key, dir, type) {
    if (!key) return rows;
    var sorted = rows.slice(); // copy
    var m = dir === "desc" ? -1 : 1;

    sorted.sort(function (a, b) {
      var va = a[key];
      var vb = b[key];

      if (type === "numeric") return (va - vb) * m;

      if (type === "date") return (new Date(va) - new Date(vb)) * m;

      // text and status — compare as strings
      var sa = type === "status" ? (va.split(":")[1] || va) : String(va);
      var sb = type === "status" ? (vb.split(":")[1] || vb) : String(vb);
      return sa.localeCompare(sb) * m;
    });

    return sorted;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  function renderCell(col, value) {
    if (col.type === "status") {
      var parts = value.split(":");
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
        html += "<td" + cellAttrs(col) + ">" + renderCell(col, row[col.key]) + "</td>";
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
      footer.textContent = "Showing " + shown + " of " + total + " orders";
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
  }

  /* ------------------------------------------------------------------ */
  /*  Init                                                               */
  /* ------------------------------------------------------------------ */

  function init(widget) {
    var src = widget.getAttribute("data-src");
    if (!src) return;

    fetch(src)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // Store state on the widget element
        widget._dt = {
          columns: data.columns,
          allRows: data.rows,
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

        render(widget);
        bindControls(widget);
      })
      .catch(function (err) {
        console.warn("Datatable fetch failed:", err);
        // Static fallback table remains visible
      });
  }

  // Boot all datatable widgets
  widgets.forEach(init);
})();
