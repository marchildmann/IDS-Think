# Changelog

## 2026-01-30

### Color Themes (`css/think.css`, `js/think.js`)

- **Theme switching architecture** — color themes are `[data-theme]` blocks in
  `think.css` that redefine `--light-*` and `--dark-*` palette variables. The
  existing light/dark toggle works automatically with any color theme.
- **Mid Century theme** (`data-theme="midcentury"`) — warm earth tones (cream,
  tan, walnut), teal accent, avocado green, terracotta red, and mustard gold.
  Both light and dark palettes included.
- **Theme selector** — `<select id="color-theme">` added to the header in all
  dashboard pages and the theme-corner in auth pages. Styled for both chrome
  and surface backgrounds.
- **Theme persistence** — JS reads/writes `data-theme` on `<html>` via
  `localStorage`, so the selected theme survives page reloads and navigation.

### Companies Page (`companies.html`)

- Added CRUD companies page with data table, search filter, create/edit dialog,
  and delete confirmation dialog.
- Table displays Name, Industry, Status (as `data-status` badge), City, Country,
  and Employees columns with Edit and Delete actions per row.
- Search input in widget header filters table rows client-side.
- Create/Edit reuses a single `<dialog>` with `[data-form]` form pattern;
  title switches between "New Company" and "Edit Company".
- Delete uses a separate confirmation `<dialog>` following the native
  `<form method="dialog">` close pattern.
- Demo data includes 6 companies across varied industries, statuses, and
  geographies.
- Added Companies link to the sidebar in all dashboard pages.

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

- **`[data-form] select` Safari fix** — switched from `appearance: auto` to
  `appearance: none` so Safari respects the shared padding and font-size rules.
  Added an inline SVG chevron (`background-image`) as a dropdown indicator to
  replace the lost native arrow.

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

### W3C Validation

- **`<time>` elements** — added `datetime` attributes to all `<time>` elements
  in `index.html` so human-readable text ("2 minutes ago") is paired with a
  machine-readable ISO timestamp.

- **`aria-label` on associated `<label>`** — moved `aria-label` from `<label>`
  elements to their associated `<input>` controls (nav-toggle, theme-toggle) to
  comply with ARIA in HTML spec. Updated across all pages.

- **`<section>` → `<div>`** — widget and dialog content areas changed from
  `<section>` to `<div>` since they don't contain their own headings.
  Updated CSS selectors in `think.css` (`dash-widget > div`,
  `dialog > div`) and inline styles in `nodes.html`.

### SEO

- **`<meta name="description">`** — added to all HTML pages:
  `index.html`, `forms.html`, `tabs.html`, `nodes.html`, `datatable.html`,
  `login.html`, `signup.html`, `pwd_forgot.html`.
