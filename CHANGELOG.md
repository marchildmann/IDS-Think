# Changelog

## 2026-01-30

### Grid System (`css/think.css`)

- **`[data-span]` switched to longhand** — changed from `grid-column: span N`
  to `grid-column-end: span N` so it composes with the new `[data-start]`
  utility without shorthand conflicts.

- **`[data-start="1"]`–`[data-start="16"]`** — new column start-position
  utilities. Composable with `[data-span]`:
  `<div data-start="3" data-span="6">` places an element at columns 3–8.

- **`[data-span-center]`** — responsive centered spans that auto-calculate
  start offsets per breakpoint. Falls back to full-width when the span exceeds
  available columns. Supported values: 4, 6, 8, 10, 12.

### Standalone Forms (`css/think.css`)

- **`[data-form] label > span:first-child`** — added `font-weight: 500` and
  `color: var(--text-1)` so standalone form labels match the `dash-widget`
  label styling.

- **`min-width: 0`** on `[data-form]` inputs — allows inputs to shrink below
  their browser-default intrinsic width (~160 px from `size="20"`), preventing
  overflow in narrow containers.

- **`[data-field-row]` responsive stacking** — changed to
  `repeat(2, minmax(0, 1fr))` and added a `< 42rem` media query that collapses
  side-by-side fields to a single column on mobile.

### Auth Pages (`signup.html`, `login.html`)

- Migrated from hardcoded `max-width` + `place-items: center` layout to the
  2x fluid grid (`data-grid="fluid"` on `<body>`).
- Cards now use `data-span-center="6"` (signup) and `data-span-center="4"`
  (login) for responsive centering via the grid system.
- Replaced `.login-card` / `.login-header` / `.login-footer` classes with
  `[data-auth-card]`, `[data-auth-header]`, `[data-auth-footer]` data
  attributes to match the design system conventions.
- Overrode `[data-form]` max-width inside auth cards so the form stretches to
  the grid-controlled card width.

### Datatable Page (`datatable.html`)

- Added missing `<dialog id="order-detail">` so the "View Detail" button
  opens the order detail dialog.
- Fixed `aria-current="page"` — was incorrectly set on the Forms link.

### Navigation

- Added Datatable link to the sidebar in all dashboard pages
  (`index.html`, `forms.html`, `tabs.html`, `nodes.html`, `datatable.html`).

### SEO

- **`<meta name="description">`** — added to all HTML pages:
  `index.html`, `forms.html`, `tabs.html`, `nodes.html`, `datatable.html`,
  `login.html`, `signup.html`, `pwd_forgot.html`.
