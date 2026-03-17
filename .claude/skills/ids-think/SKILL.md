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

Always use the hosted CDN URLs for the latest version:

```html
<!-- Required -->
<link rel="stylesheet" href="https://think.iotdata.systems/css/think.css">
<script type="module" src="https://think.iotdata.systems/js/think.js"></script>

<!-- Optional: datatable features -->
<link rel="stylesheet" href="https://think.iotdata.systems/css/think_datatable.css">
<script type="module" src="https://think.iotdata.systems/js/think_datatable.js"></script>

<!-- Optional: color themes -->
<link rel="stylesheet" href="https://think.iotdata.systems/css/themes/midcentury.css">
<link rel="stylesheet" href="https://think.iotdata.systems/css/themes/rams.css">
```

Base URL: `https://think.iotdata.systems/`

Apply a theme: `<html data-theme="midcentury">` or `<html data-theme="rams">`. Omit for the default neutral theme.

## Page Shell

Every dashboard page follows this structure:

```html
<body>
  <input type="checkbox" id="nav-toggle" data-visually-hidden>
  <input type="checkbox" id="theme-toggle" data-visually-hidden>

  <header>
    <label for="nav-toggle">&#9776;</label>
    <strong>App Name</strong>
    <nav><!-- header links --></nav>
    <select id="theme-select">
      <option value="">Default</option>
      <option value="midcentury">Midcentury</option>
      <option value="rams">Rams</option>
    </select>
    <label for="theme-toggle" data-role="theme-toggle"></label>
    <span data-role="avatar">U</span>
  </header>

  <nav>
    <span data-role="heading">Section</span>
    <a href="#" aria-current="page">Active Link</a>
    <a href="#">Other Link</a>
  </nav>

  <main>
    <!-- content here -->
  </main>
</body>
```

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

```html
<dash-board data-span="full">
  <!-- widgets go here -->
</dash-board>
```

Auto-responsive: 1 col (sm) → 2 col (md) → 4 col (lg+).

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
- Has `container-type: inline-size` — children can use `@container` queries
- Header and footer are optional

### `<dash-metric>` — KPI display

```html
<dash-metric>
  <small>Revenue</small>
  <strong>$1,234,567</strong>
  <small data-trend="up">+12.5%</small>
</dash-metric>
```

- `data-trend="up"` — green positive color
- `data-trend="down"` — red negative color
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

## Reference

For the complete data attribute catalog, color token list, and CSS custom properties, read the reference file at `${CLAUDE_SKILL_DIR}/reference.md`.

For working examples, read the HTML demo pages in the project root: `index.html`, `forms.html`, `tabs.html`, `grid.html`, `datatable.html`.
