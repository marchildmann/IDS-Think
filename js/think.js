/**
 * IDS-Think — Minimal JavaScript
 * Only used where CSS alone cannot detect runtime state.
 */

/* --- Theme toggle: sync checkbox with OS preference --- */
(() => {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const mq = matchMedia("(prefers-color-scheme: dark)");

  // Sync checkbox to system preference on load
  toggle.checked = mq.matches;

  // Keep in sync if the OS preference changes while the page is open
  mq.addEventListener("change", (e) => {
    toggle.checked = e.matches;
  });
})();


/* --- Revenue Trend chart (uPlot) --- */
(() => {
  const el = document.getElementById("revenue-chart");
  if (!el || typeof uPlot === "undefined") return;

  // Revenue data — JSON structure, easily replaceable with a fetch() call
  const revenueJSON = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    values: [19293, 26528, 23151, 34727, 31351, 40997,
             37621, 44373, 42444, 45820, 39550, 48232]
  };

  // Read design tokens from CSS custom properties
  function themeColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      accent:  s.getPropertyValue("--accent").trim()  || "#6366f1",
      text:    s.getPropertyValue("--text-1").trim()   || "#666",
      grid:    s.getPropertyValue("--surface-2").trim() || "#e5e5e5",
      bg:      s.getPropertyValue("--surface-1").trim() || "#fff",
    };
  }

  // Build uPlot options from current theme + container size
  function chartOpts(width) {
    const c = themeColors();
    return {
      width:  width,
      height: Math.round(width * 2 / 3),  // 3:2 aspect ratio
      cursor: { show: false },
      select: { show: false },
      legend: { show: false },
      padding: [8, 16, 0, 0],
      scales: {
        x: { time: false, range: (u, min, max) => [min - 0.5, max + 0.5] },
        y: { range: [0, null] },
      },
      axes: [
        {
          stroke: c.text,
          grid:   { show: false },
          ticks:  { show: false },
          gap:    4,
          size:   24,
          values: (_, vals) => vals.map(v => revenueJSON.labels[v] ?? ""),
          font:   "11px system-ui, sans-serif",
        },
        {
          stroke: c.text,
          grid:   { stroke: c.grid, width: 1 },
          ticks:  { show: false },
          gap:    8,
          size:   48,
          incrs:  [10000],
          values: (_, vals) => vals.map(v => "$" + (v / 1000).toFixed(0) + "k"),
          font:   "11px system-ui, sans-serif",
        },
      ],
      series: [
        {},
        {
          label:  "Revenue",
          fill:   c.accent,
          stroke: c.accent,
          width:  0,
          paths:  uPlot.paths.bars({ size: [0.6] }),
          points: { show: false },
        },
      ],
    };
  }

  // Transform JSON → uPlot data format: [[x indices], [y values]]
  const data = [
    revenueJSON.labels.map((_, i) => i),
    revenueJSON.values,
  ];

  // Initial render
  let chart = new uPlot(chartOpts(el.clientWidth), data, el);

  // Responsive: resize chart when container changes
  const ro = new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    if (w > 0) chart.setSize({ width: w, height: Math.round(w * 2 / 3) });
  });
  ro.observe(el);

  // Theme change: rebuild chart with updated colors
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      // Wait one frame for CSS custom properties to update
      requestAnimationFrame(() => {
        const w = el.clientWidth;
        chart.destroy();
        chart = new uPlot(chartOpts(w), data, el);
      });
    });
  }
})();


/* --- Form groups: serialize & POST as JSON --- */
document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!form.dataset.formGroup || !form.dataset.action) return;
  e.preventDefault();

  const group  = form.dataset.formGroup;
  const action = form.dataset.action;
  const fields = Object.fromEntries(new FormData(form));

  const payload = { group, fields };

  try {
    const res  = await fetch(action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    form.dispatchEvent(new CustomEvent("form-response", {
      bubbles: true,
      detail: { group, status: res.status, data },
    }));
  } catch (err) {
    form.dispatchEvent(new CustomEvent("form-response", {
      bubbles: true,
      detail: { group, status: 0, error: err.message },
    }));
  }
});
