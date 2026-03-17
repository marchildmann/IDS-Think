---
name: ids-think
description: Use when building UI with the IDS-Think CSS framework, creating HTML pages, styling components, or asking about available elements and data attributes. Covers the grid system, dashboard widgets, forms, tables, tabs, themes, and all data-attribute APIs.
---

# IDS-Think CSS Framework

IDS-Think is a **zero-build, CSS-first UI framework** that uses semantic HTML, custom elements, and data attributes instead of CSS classes.

## Core Principles — MUST follow

1. **No CSS classes.** All styling is driven by semantic HTML elements, custom elements, and `data-*` attributes.
2. **Custom elements for domain concepts** — use `<dash-board>`, `<dash-widget>`, `<dash-metric>`, `<tab-group>`, `<tab-panel>` instead of `<div class="...">`.
3. **Data attributes for variants** — `data-span`, `data-density`, `data-status`, `data-variant`, etc.
4. **CSS `:has()` eliminates JS** — theme toggle, nav toggle, and form validation are CSS-only via hidden checkboxes.
5. **Container queries, not media queries** — widgets adapt to their own container size.
6. **OKLCH color space** — all colors use `oklch()` with the Theme DNA pattern (hue/chroma pairs).
7. **`@layer` cascade** — `reset, tokens, layout, components, utilities` — respect this order.
8. **Density variable** — `--density` (default 1) scales all spacing. Use `data-density="compact"` (0.75) or `data-density="comfortable"` (1.25).
9. **Minimal JS** — only for theme sync, charts, and data fetching. Never use JS for what CSS can do.

## Files to Include

Always use the jsDelivr CDN URLs for the latest version:

```html
<!-- Required -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/css/think.css">
<script src="https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/js/think.js" defer></script>

<!-- Optional: datatable features -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/css/think_datatable.css">
<script src="https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/js/think_datatable.js" defer></script>

<!-- Optional: color themes -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/css/themes/midcentury.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/css/themes/rams.css">
```

Base URL: `https://cdn.jsdelivr.net/gh/marchildmann/IDS-Think@main/`

Apply a theme: `<html data-theme="midcentury">` or `<html data-theme="rams">`. Omit for the default neutral theme.

## Page Shell

Every dashboard page follows this structure. **Pay close attention to element nesting** — the checkboxes live *inside* `<header>`, each immediately after its `<label>`.

```html
<body>
  <!-- Skip link — MUST be the first focusable element in <body> -->
  <a href="#main-content" data-skip-link>Skip to content</a>

  <header>
    <!-- Nav toggle: label first, then its checkbox -->
    <label for="nav-toggle">&#9776;</label>
    <input type="checkbox" id="nav-toggle" data-visually-hidden aria-label="Toggle navigation">

    <h1>App Name</h1>
    <nav aria-label="Primary">
      <a href="#">Dashboard</a>
      <a href="#">Analytics</a>
    </nav>
    <span data-role="spacer"></span>
    <search>
      <input type="search" placeholder="Search...">
    </search>
    <select id="color-theme" aria-label="Color theme">
      <option value="">Default</option>
      <option value="midcentury">Mid Century</option>
      <option value="rams">Rams</option>
    </select>
    <!-- Theme toggle: checkbox after its label -->
    <input type="checkbox" id="theme-toggle" data-visually-hidden aria-label="Toggle dark mode">
    <label for="theme-toggle" data-role="theme-toggle"></label>
    <span data-role="avatar">U</span>
  </header>

  <!-- Sidebar navigation -->
  <nav aria-label="Sidebar">
    <span data-role="heading">Section</span>
    <a href="#" aria-current="page">Active Link</a>
    <a href="#">Other Link</a>
  </nav>

  <!-- Main content — MUST have id and data-grid -->
  <main id="main-content" data-grid="fluid">

    <!-- Breadcrumb (optional) -->
    <nav aria-label="Breadcrumb" data-span="full">
      <ol>
        <li><a href="#">Home</a></li>
        <li><a href="#">Section</a></li>
        <li>Current Page</li>
      </ol>
    </nav>

    <!-- Page title with subtitle (optional) -->
    <hgroup data-span="full">
      <h1>Page Title</h1>
      <p>Subtitle or description</p>
    </hgroup>

    <!-- ALL widgets go inside a single <dash-board> -->
    <dash-board data-span="full">
      <!-- <dash-widget> elements here -->
    </dash-board>
  </main>
</body>
```

### Critical layout rules

- **Skip link**: `<a href="#main-content" data-skip-link>` must be the first element in `<body>`.
- **Checkboxes inside `<header>`**: `#nav-toggle` and `#theme-toggle` are *inside* `<header>`, each placed immediately after its `<label>`. Do NOT put them before `<header>`.
- **`<main>` requires attributes**: Always use `<main id="main-content" data-grid="fluid">`.
- **Single `<dash-board>`**: All `<dash-widget>` elements go inside **one** `<dash-board data-span="full">` nested inside `<main>`. Do NOT create multiple `<dash-board>` elements.
- **`<hgroup>` for page titles**: Use `<hgroup data-span="full">` with `<h1>` + `<p>` for page title + subtitle. Place it as a direct child of `<main>`, before `<dash-board>`.
- **Breadcrumb**: Use `<nav aria-label="Breadcrumb" data-span="full">` with an `<ol>` inside `<main>`, before `<hgroup>`.
- Dark mode: CSS-only via `#theme-toggle` checkbox and `:has()`. JS in `think.js` syncs to OS preference on load.
- Mobile nav: CSS-only via `#nav-toggle` checkbox. Sidebar shows/hides via `:has(#nav-toggle:checked)`.

## Grid System (IBM 2x Grid)

| Breakpoint | Min-width | Columns | Gutter | Margin |
|------------|-----------|---------|--------|--------|
| sm         | 320px     | 4       | 32px   | 0      |
| md         | 672px     | 8       | 32px   | 16px   |
| lg         | 1056px    | 16      | 32px   | 24px   |
| xl         | 1312px    | 16      | 32px   | 24px   |
| max        | 1584px    | 16      | 32px   | 24px   |

```html
<section data-grid="fluid">
  <div data-span="4">Quarter width on lg</div>
  <div data-span="8">Half width on lg</div>
  <div data-span="full">Full width</div>
  <div data-span="6" data-start="5">Starts at column 5, spans 6</div>
  <div data-span-center="8">Centered 8-column block</div>
</section>
```

- `data-span="1"` through `data-span="16"` — column span
- `data-span="full"` — spans all columns (1 / -1)
- `data-start="1"` through `data-start="16"` — column start
- `data-span-center="4|6|8|10|12"` — auto-centered with responsive fallbacks

Spans auto-clamp at smaller breakpoints (e.g. `data-span="8"` becomes full-width on sm).

## Dashboard Components

### `<dash-board>` — Widget grid container

There must be exactly **one** `<dash-board>` per page, as a direct child of `<main>`:

```html
<main id="main-content" data-grid="fluid">
  <dash-board data-span="full">
    <!-- ALL dash-widget elements go here -->
  </dash-board>
</main>
```

Auto-responsive: 1 col (sm) → 2 col (md) → 4 col (lg+). Do NOT create separate `<dash-board>` elements per section — this breaks spacing.

### `<dash-widget>` — Card component

```html
<dash-widget data-span="2">
  <header>
    <h2>Widget Title</h2>
    <button>Action</button>
  </header>
  <div>
    <!-- content: table, form, chart, metrics -->
  </div>
  <footer>Footer text</footer>
</dash-widget>
```

- `data-span="1"` to `data-span="4"` — dashboard column span
- `data-span="full"` — spans all dashboard columns (use this instead of `data-span="4"` for full-width widgets)
- Has `container-type: inline-size` — children can use `@container` queries
- Header and footer are optional

### `<dash-metric>` — KPI display

Metrics **must** be nested inside a widget: `<dash-widget>` → `<div>` → `<dash-metric-group>` → `<dash-metric>`. Never place `<dash-metric>` directly inside `<dash-board>`.

```html
<dash-widget data-span="full">
  <header><h2>Key Metrics</h2></header>
  <div>
    <dash-metric-group>
      <dash-metric data-trend="up">
        <small>Revenue</small>
        <strong>$1,234,567</strong>
        <small>&#x25B2; +12.5% from last month</small>
      </dash-metric>
      <dash-metric data-trend="down">
        <small>Churn</small>
        <strong>3.2%</strong>
        <small>&#x25BC; -0.5% from last month</small>
      </dash-metric>
    </dash-metric-group>
  </div>
</dash-widget>
```

- `data-trend="up"` on `<dash-metric>` — green positive color for the whole metric
- `data-trend="down"` on `<dash-metric>` — red negative color for the whole metric
- **Put `data-trend` on the `<dash-metric>` element itself**, not on the child `<small>`
- Wrap multiple in `<dash-metric-group>` for auto-grid layout

### `<tab-group>` — CSS-only tabs

```html
<tab-group>
  <input type="radio" name="tabs" id="t1" checked data-visually-hidden>
  <label for="t1">Tab 1</label>
  <tab-panel>Content for tab 1</tab-panel>

  <input type="radio" name="tabs" id="t2" data-visually-hidden>
  <label for="t2">Tab 2</label>
  <tab-panel>Content for tab 2</tab-panel>
</tab-group>
```

Order matters: `<input>` → `<label>` → `<tab-panel>` for each tab. The CSS selector `:checked + label + tab-panel` controls visibility.

## Tables

```html
<table>
  <thead>
    <tr>
      <th data-sort>Name</th>
      <th data-sort>Amount</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">Acme Corp</td>
      <td data-label="Amount">$1,200</td>
      <td data-label="Status"><span data-status="active">Active</span></td>
    </tr>
  </tbody>
</table>
```

- `th[data-sort]` — makes column sortable (JS adds `data-sort="asc"|"desc"`)
- `td[data-label]` — used for responsive card layout at narrow widths (`::before` shows label)
- Striped rows and hover are automatic

## Buttons

```html
<button>Default</button>
<button data-variant="primary">Primary</button>
<button data-variant="ghost">Ghost</button>
<button data-variant="dark">Dark</button>
```

## Status Badges

```html
<span data-status="active">Active</span>
<span data-status="pending">Pending</span>
<span data-status="inactive">Inactive</span>
```

Renders as pill with colored dot indicator.

## Forms

### Inside a widget

```html
<dash-widget>
  <header><h2>Create Order</h2></header>
  <div>
    <form>
      <label>
        <span>Customer Name</span>
        <input type="text" placeholder="Name" required>
      </label>
      <label>
        <span>Amount</span>
        <input type="number" placeholder="0.00" required>
      </label>
      <div data-actions>
        <button type="button" data-variant="ghost">Cancel</button>
        <button type="submit" data-variant="primary">Submit</button>
      </div>
    </form>
  </div>
</dash-widget>
```

### Standalone form

```html
<form data-form>
  <label>
    <span>Email</span>
    <input type="email" placeholder="you@example.com">
  </label>
  <div data-field-row>
    <label><span>First</span><input type="text"></label>
    <label><span>Last</span><input type="text"></label>
  </div>
  <div data-actions>
    <button data-variant="primary">Save</button>
  </div>
</form>
```

- `data-form` — standalone form styling (max-width 65ch, filled-style inputs)
- `data-field-row` — two-column responsive row
- `data-actions` — button row
- Validation: CSS-only via `:has(input:invalid:not(:placeholder-shown))`

## Dialogs

```html
<dialog>
  <header><h2>Confirm</h2></header>
  <div><p>Are you sure?</p></div>
  <footer>
    <form method="dialog">
      <button data-variant="ghost">Cancel</button>
      <button data-variant="primary">Confirm</button>
    </form>
  </footer>
</dialog>
```

Open with JS: `document.querySelector('dialog').showModal()`. Animated entrance via `@starting-style`.

## Utility Attributes

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `data-visually-hidden` | — | Screen-reader only |
| `data-skip-link` | — | Keyboard skip navigation |
| `data-role="spacer"` | — | Flexible spacer (`flex: 1`) |
| `data-role="avatar"` | — | Circular avatar badge |
| `data-ratio` | `1x1`, `2x1`, `2x3`, `3x2`, `4x3`, `16x9` | Aspect ratio |
| `data-text` | `mono`, `muted`, `small` | Text utilities |
| `data-density` | `compact`, `comfortable` | Spacing scale |

## Common Mistakes to Avoid

1. **Never use CSS classes** — use data attributes and semantic elements instead
2. **Never use `<div class="widget">`** — use `<dash-widget>` custom element
3. **Never use `<div class="grid">`** — use `<section data-grid="fluid">`
4. **Never add JS for theme/nav toggle** — these are CSS-only via `:has()` and hidden checkboxes
5. **Never use hex/rgb colors** — use CSS custom properties (`var(--accent)`, `var(--surface-1)`, etc.)
6. **Never hardcode spacing** — use `var(--space-1)` through `var(--space-7)`
7. **Don't forget `data-label` on `<td>`** — needed for responsive table card layout
8. **Don't use media queries in widgets** — use `@container` queries instead
9. **Don't put checkboxes before `<header>`** — `#nav-toggle` and `#theme-toggle` go *inside* `<header>`, each after its `<label>`
10. **Don't create multiple `<dash-board>` elements** — use exactly one `<dash-board data-span="full">` inside `<main>`
11. **Don't put `<dash-metric>` directly in `<dash-board>`** — nest as: `<dash-widget>` → `<div>` → `<dash-metric-group>` → `<dash-metric>`
12. **Don't put `data-trend` on child `<small>`** — put `data-trend="up|down"` on the `<dash-metric>` element itself
13. **Don't use `data-span="4"` for full-width widgets** — use `data-span="full"` instead
14. **Don't forget `<main id="main-content" data-grid="fluid">`** — both the `id` and `data-grid` are required

## Reference

For the complete data attribute catalog, color token list, and CSS custom properties, read the reference file at `${CLAUDE_SKILL_DIR}/reference.md`.

For working examples, read the HTML demo pages in the project root: `index.html`, `forms.html`, `tabs.html`, `grid.html`, `datatable.html`.
