# IDS-Think Reference — CSS Custom Properties & Data Attributes

## CSS Custom Properties (Design Tokens)

### Spacing (scaled by `--density`)

| Token | Default | Purpose |
|-------|---------|---------|
| `--space-1` | 8px | Tight gaps, padding |
| `--space-2` | 16px | Standard gaps |
| `--space-3` | 24px | Section padding |
| `--space-4` | 32px | Large gaps |
| `--space-5` | 48px | Section margins |
| `--space-6` | 64px | Page-level spacing |
| `--space-7` | 80px | Hero spacing |

### Typography (fluid, clamp-based)

| Token | Range | Purpose |
|-------|-------|---------|
| `--text-xs` | 11–12px | Fine print |
| `--text-sm` | 13–14px | Labels, captions |
| `--text-base` | 15–16px | Body text |
| `--text-lg` | 17–18px | Subheadings |
| `--text-xl` | 20–24px | Section headings |
| `--text-2xl` | 24–30px | Page headings |
| `--text-3xl` | 30–40px | Hero/display text |

### Surface Colors (light/dark auto-switch)

| Token | Purpose |
|-------|---------|
| `--surface-0` | Page background |
| `--surface-1` | Card/widget background |
| `--surface-2` | Borders, subtle backgrounds |
| `--surface-3` | Hover states, dividers |

### Text Colors

| Token | Purpose |
|-------|---------|
| `--text-0` | Primary text (highest contrast) |
| `--text-1` | Secondary text (labels, headings) |
| `--text-2` | Muted text (captions, hints) |

### Semantic Colors

| Token | Purpose |
|-------|---------|
| `--accent` | Primary action color (links, buttons) |
| `--accent-soft` | Light accent tint (focus rings, badges) |
| `--positive` | Success/good (green) |
| `--negative` | Error/bad (red) |
| `--warning` | Warning/caution (amber) |

### Chrome Colors (header/nav)

| Token | Purpose |
|-------|---------|
| `--chrome-bg` | Header/nav background |
| `--chrome-text` | Nav text (inactive) |
| `--chrome-text-active` | Nav text (active) |
| `--chrome-hover` | Nav hover background |
| `--chrome-overlay` | Mobile nav backdrop |

### Layout

| Token | Default | Purpose |
|-------|---------|---------|
| `--sidebar-width` | 16rem | Sidebar nav width |
| `--header-height` | 3rem | Top header height |
| `--widget-min` | 20rem | Widget minimum width |
| `--radius-s` | 0.25rem | Small border radius |
| `--radius-m` | 0.5rem | Medium border radius |
| `--radius-l` | 0.75rem | Large border radius |

### Grid

| Token | Purpose |
|-------|---------|
| `--grid-columns` | Current breakpoint column count (4/8/16) |
| `--grid-gutter` | Column gap (32px) |
| `--grid-margin` | Outer margin (responsive) |
| `--grid-padding` | Inline padding (16px) |
| `--grid-max-width` | Max content width (99rem / 1584px) |

## Complete Data Attribute Reference

### Layout & Grid

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-grid` | `"fluid"` | `<section>`, `<div>` | Activates CSS grid |
| `data-span` | `"1"`–`"16"`, `"full"` | Grid children | Column span |
| `data-start` | `"1"`–`"16"` | Grid children | Column start position |
| `data-span-center` | `"4"`, `"6"`, `"8"`, `"10"`, `"12"` | Grid children | Centered column span |

### Dashboard

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-span` | `"1"`–`"4"`, `"full"` | `<dash-widget>` | Dashboard grid span (`"full"` for full-width) |
| `data-trend` | `"up"`, `"down"` | `<dash-metric>` | KPI trend indicator (place on the element itself, not on children) |

### Forms

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-form` | — | `<form>` | Standalone form styling |
| `data-field-row` | — | `<div>` | Two-column field row |
| `data-actions` | — | `<div>` | Button row container |
| `data-form-group` | string | `<form>` | Form group identifier |
| `data-action` | URL | `<form>` | Submission endpoint |
| `data-date-picker` | — | `<div>` | Date picker wrapper |
| `data-date-separator` | — | `<span>` | "to" text between dates |

### Buttons

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-variant` | `"primary"`, `"ghost"`, `"dark"` | `<button>` | Button style variant |

### Status & State

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-status` | `"active"`, `"pending"`, `"inactive"` | `<span>` | Status badge with dot |
| `data-event` | `"success"`, `"warning"`, `"error"` | Activity items | Event color coding |

### Tables

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-sort` | `"asc"`, `"desc"` (set by JS) | `<th>` | Sortable column header |
| `data-label` | string | `<td>` | Label for responsive card layout |

### Datatable

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-datatable` | — | `<dash-widget>` | Enable datatable mode |
| `data-src` | URL | `<dash-widget>` | JSON data source URL |
| `data-datatable-filter` | — | `<input>` | Search filter input |
| `data-datatable-limit` | — | `<select>` | Row limit selector |
| `data-datatable-export` | — | `<button>` | Export trigger |
| `data-datatable-url` | — | `<input>` | Remote URL input |
| `data-datatable-url-load` | — | `<button>` | Load remote data |
| `data-datatable-insights` | — | `<div>` | Insights panel container |
| `data-datatable-remote` | — | `<div>` | Remote URL controls wrapper |
| `data-datatable-table` | — | `<table>` | Main datatable table |
| `data-vs-spacer` | — | `<tr>` | Virtual scroll spacer row |

### Utilities

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-visually-hidden` | — | Any | Screen-reader only (hidden visually) |
| `data-skip-link` | — | `<a>` | Keyboard skip navigation |
| `data-role` | `"spacer"` | `<span>` | Flex spacer (flex: 1) |
| `data-role` | `"heading"` | `<span>` | Nav section heading |
| `data-role` | `"avatar"` | `<span>` | Circular avatar in header |
| `data-role` | `"theme-toggle"` | `<label>` | Dark mode toggle switch |
| `data-ratio` | `"1x1"`, `"2x1"`, `"2x3"`, `"3x2"`, `"4x3"`, `"16x9"` | Any | Aspect ratio constraint |
| `data-text` | `"mono"` | Any | Monospace font |
| `data-text` | `"muted"` | Any | Muted text color |
| `data-text` | `"small"` | Any | Smaller font size |
| `data-density` | `"compact"`, `"comfortable"` | Any container | Spacing density override |

### Theming

| Attribute | Values | Element | Purpose |
|-----------|--------|---------|---------|
| `data-theme` | `"midcentury"`, `"rams"` | `<html>` | Color theme selection |
| `data-theme-corner` | — | `<div>` | Theme selector on auth pages |
| `data-auth-card` | — | `<div>` | Auth page card layout |
| `data-auth-header` | — | `<div>` | Auth card header |
| `data-auth-footer` | — | `<div>` | Auth card footer |

## Custom Elements

| Element | Purpose | Container |
|---------|---------|-----------|
| `<dash-board>` | Widget grid (auto-responsive 1→2→4 cols) | `<main>` or grid child |
| `<dash-widget>` | Card with header/content/footer | `<dash-board>` |
| `<dash-metric>` | KPI with label/value/trend | `<dash-widget>` content |
| `<dash-metric-group>` | Auto-grid wrapper for metrics | `<dash-widget>` content |
| `<tab-group>` | CSS-only tab container | Anywhere |
| `<tab-panel>` | Tab content panel | `<tab-group>` |

## Creating a New Theme

Define hue/chroma pairs in a new CSS file:

```css
[data-theme="mytheme"] {
  --_surface: 0.01 250;   /* chroma hue */
  --_text:    0.01 250;
  --_accent:  0.20 200;
  --_positive:0.15 145;
  --_negative:0.18 25;
  --_warning: 0.14 85;
  --_chrome:  0.02 250;
}
```

Light and dark palettes auto-generate from these DNA values. The lightness dimension is handled by the base `think.css` palette definitions.
