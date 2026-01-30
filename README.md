# IDS-Think

A modern CSS-first UI framework built on semantic HTML, custom elements, and data attributes. No classes, no build step.

## Philosophy

- **Semantic HTML as styling hooks** — `<header>`, `<nav>`, `<section>`, `<table>` drive layout directly
- **Custom elements for domain concepts** — `<dash-board>`, `<dash-widget>`, `<dash-metric>`, `<tab-group>`
- **Data attributes for variants** — `data-span`, `data-trend`, `data-status`, `data-variant`
- **CSS `:has()` eliminates JavaScript** — theme toggle, nav toggle, form validation, tab switching
- **Container queries** — widgets adapt to their own size, not the viewport
- **Density variable** — one `--density` property scales all spacing proportionally
- **No build step** — drop in the CSS and go

## Quick Start

```html
<link rel="stylesheet" href="css/think.css">
<script src="js/think.js" defer></script>
```

## Grid System

Based on the IBM 2x Grid spec with responsive breakpoints:

| Breakpoint | Width    | Columns |
|------------|----------|---------|
| sm         | 320px    | 4       |
| md         | 672px    | 8       |
| lg         | 1056px   | 16      |
| xl         | 1312px   | 16      |
| max        | 1584px   | 16      |

```html
<main data-grid="fluid">
  <dash-board data-span="full">
    <dash-widget data-span="2">...</dash-widget>
    <dash-widget>...</dash-widget>
  </dash-board>
</main>
```

## Dark Mode

CSS-only via a hidden checkbox and `:has()`. JS only syncs with the OS preference on load.

```html
<input type="checkbox" id="theme-toggle" data-visually-hidden>
<label for="theme-toggle" data-role="theme-toggle" aria-label="Toggle dark mode"></label>
```

## Components

### Widgets

```html
<dash-widget data-span="2">
  <header><h2>Title</h2></header>
  <section>Content</section>
  <footer>Footer</footer>
</dash-widget>
```

### Metrics

```html
<dash-metric data-trend="up">
  <small>Revenue</small>
  <strong>$48,232</strong>
  <small>+12.4% from last month</small>
</dash-metric>
```

### Tabs (CSS-only)

```html
<tab-group>
  <input type="radio" name="tabs" id="tab1" checked data-visually-hidden>
  <label for="tab1">Tab 1</label>
  <tab-panel>Content 1</tab-panel>

  <input type="radio" name="tabs" id="tab2" data-visually-hidden>
  <label for="tab2">Tab 2</label>
  <tab-panel>Content 2</tab-panel>
</tab-group>
```

### Forms

```html
<form data-form data-form-group="contact" data-action="/api/message">
  <label>
    <span>Email</span>
    <input type="email" name="email" required>
  </label>
  <div data-actions>
    <button data-variant="primary" type="submit">Send</button>
  </div>
</form>
```

### Status Badges

```html
<span data-status="active">Completed</span>
<span data-status="pending">Pending</span>
<span data-status="inactive">Cancelled</span>
```

### Node Editor

Visual JSON API pipeline builder using [LiteGraph.js](https://github.com/jagenjo/litegraph.js). Custom node types for HTTP requests, JSON filtering, merging, and inspection.

## Browser Support

Modern browsers only. Requires `:has()`, container queries, `color-mix()`, and `@property`.

## License

MIT
