# Changelog

## 2026-02-03

### Modern CSS Improvements (`css/think.css`)

Based on modern CSS best practices:

- **`@layer` declarations** — added explicit layer ordering
  (`@layer reset, tokens, layout, components, utilities;`) for predictable
  specificity control. Each section wrapped in its respective layer.

- **OKLCH color space** — converted all hex colors to OKLCH for perceptual
  uniformity. Example: `#0f62fe` → `oklch(52% 0.25 264)`.

- **Fluid typography** — added clamp()-based type scale that smoothly scales
  between 320px and 1200px viewports:
  - `--text-xs` through `--text-3xl` (11px–40px range)
  - Applied to headings and metric displays

- **`@starting-style` for dialogs** — native entrance animations for `<dialog>`
  elements. Dialogs fade in with subtle translate and scale; backdrop fades
  with blur. No JavaScript required.

- **`ch` units** — content-aware widths for search input (`max-width: 40ch`),
  dialogs (`width: min(65ch, ...)`), and forms (`max-width: 65ch`).

### Theme DNA Pattern (`css/think.css`, `css/themes/*.css`)

- **Shared hue/chroma variables** — themes now define "DNA" variables
  (`--_surface`, `--_text`, `--_accent`, `--_positive`, `--_negative`,
  `--_warning`, `--_chrome`) that store chroma and hue pairs. Both light and
  dark palettes reference these with only lightness varying.

- **Reduced duplication** — the pattern makes the relationship between light
  and dark modes explicit and reduces repetition when creating new themes.

### External Theme Files (`css/themes/`)

- **Themes extracted** — midcentury and rams themes moved from `think.css` to
  separate files for independent caching and on-demand loading:
  - `css/themes/midcentury.css` — warm earth tones, teal accent, walnut chrome
  - `css/themes/rams.css` — functional neutrals, amber accent

- **Loading pattern** — themes loaded via separate `<link>` tags:
  ```html
  <link rel="stylesheet" href="css/think.css">
  <link rel="stylesheet" href="css/themes/rams.css">
  ```

### Rams Theme Fixes (`css/themes/rams.css`)

- **Pure neutral surfaces** — removed greenish tint (hue 145) from surfaces
  that made light mode look "dirty". Now uses `0 0` (pure neutral) for
  `--_surface`, `--_text`, and `--_chrome`.

- **Cleaner contrast** — adjusted lightness values (99% cards, 95% background)
  for crisp white/gray surfaces with amber as the singular accent color,
  true to Dieter Rams' functional aesthetic.

## 2026-02-02

### Datatable: Virtual Scrolling & Sticky Header (`js/think_datatable.js`, `css/think_datatable.css`, `datatable.html`)

- **Viewport-filling layout** — the datatable widget now fills the remaining
  viewport height. JS measures the widget position on init and resize, sets the
  height dynamically (min 320px).
- **Sticky thead** — column headers stay fixed at the top of the scroll area
  while the table body scrolls, via `position: sticky` on `th` elements.
- **Virtual scrolling** — for datasets exceeding 50 rows, only visible rows
  plus a buffer (~30 DOM nodes) are rendered. Spacer `<tr data-vs-spacer>`
  elements maintain correct scroll height. Scroll-driven updates use
  `requestAnimationFrame` coalescing and only replace `tbody.innerHTML`.
- **Row height measurement** — first render uses the full path to measure
  actual row height via `getBoundingClientRect()`, then auto-upgrades to
  virtual mode on re-render.
- **Scroll reset** — filter, sort, and limit changes reset scroll to top and
  recalculate the virtual window.
- **Card layout safeguard** — virtual scrolling is disabled and spacer rows
  are hidden in narrow containers (`@container (width < 28rem)`).
- **Remote URL input** — `[data-datatable-url]` input + Load button allows
  loading any JSON URL at runtime. Toggled via `data-datatable-remote`
  attribute on the widget.
- **Extracted CSS** — all datatable-specific styles moved from `think.css`
  to `css/think_datatable.css` to keep the core stylesheet clean.

### Datatable Enhancement (`js/think_datatable.js`, `datatable.html`)

- **`think_datatable.js`** — standalone script that enhances any
  `[data-datatable]` widget with JSON fetch, column sorting, search filter,
  row limit, and export placeholder. Keeps `think.js` untouched.
- **JSON fetch** — `data-src` attribute on the widget specifies the URL.
  JSON format: `{ columns: [...], rows: [...] }` with typed columns
  (`text`, `numeric`, `date`, `status`).
- **Column sorting** — click any `th[data-sort]` header to sort. Type-aware
  comparison: locale for text, numeric for amounts, Date parse for dates.
  Existing CSS indicators (⇕/▲/▼) work automatically.
- **Search filter** — `[data-datatable-filter]` input filters all visible
  columns in real-time.
- **Row limit** — `[data-datatable-limit]` select shows 10/50/100 rows.
- **Export button** — `[data-datatable-export]` placeholder (alert for now).
- **Responsive toolbar** — stacks filter/limit/export on narrow containers
  via `@container` query.
- **Progressive enhancement** — static HTML table remains as no-JS fallback.
- **Demo data** — `data/orders.json` with 25 sample order rows.

## 2026-01-30

### Color Themes (`css/think.css`, `js/think.js`)

- **Theme switching architecture** — color themes are `[data-theme]` blocks in
  `think.css` that redefine `--light-*` and `--dark-*` palette variables. The
  existing light/dark toggle works automatically with any color theme.
- **Mid Century theme** (`data-theme="midcentury"`) — warm earth tones (cream,
  tan, walnut), teal accent, avocado green, terracotta red, and mustard gold.
  Both light and dark palettes included.
- **Rams theme** (`data-theme="rams"`) — functional neutrals inspired by the
  Dieter Rams / Braun palette (#BF7C2A, #C09C6F, #5F503E, #9C9C9C, #E1E4E1).
  Amber accent, muted olive green, restrained warm grays. Light and dark palettes.
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
