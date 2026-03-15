# MOTD / Banner — Design Spec

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add a MOTD (Message of the Day) banner to the top of the terminal on `layertwo.dev`. The banner appears instantly when the page loads, before the existing command-typewriter animations begin. It consists of a fake "Last login:" line (dynamically generated) and a dim ASCII art rendering of the site name, followed by a horizontal divider.

## Style

- **ASCII art color:** `#555` (dim gray — matches the existing muted palette)
- **Last login line color:** `#555`
- **Divider color:** `#333`
- **Animation:** none — banner is visible immediately on page load
- **Font:** inherits `Roboto Mono` from `.terminal-body`

## Components

### 1. HTML — `src/site/index.njk`

Add a single `.banner` wrapper as the **first child** of `.terminal-body`:

```html
<div class="banner">
  <div class="banner-last-login"></div>
  <pre class="banner-ascii"> _                     _
| | __ _ _   _ ___ _ __| |___      _____
| |/ _` | | | / _ \ '__| __\ \ /\ / / _ \
| | (_| | |_| \  __/ |  | |_ \ V  V / (_) |
|_|\__,_|\__, |\___|_|   \__| \_/\_/ \___/
         |___/</pre>
  <div class="banner-sep">────────────────────────────────</div>
</div>
```

Add a script reference before `</body>`:

```html
<script src="/terminal-banner.js"></script>
```

### 2. CSS — `src/site/styles.css`

Add banner styles:

```css
.banner { margin-bottom: 0.75rem; }
.banner-last-login { color: #555; font-size: 0.75rem; margin-bottom: 0.25rem; }
.banner-ascii { color: #555; margin: 0; padding: 0; line-height: 1.2; font-size: 0.78rem; white-space: pre; font-family: inherit; }
.banner-sep { color: #333; margin-top: 0.4rem; }
```

Update `nth-child` animation selectors: the `.banner` div becomes child 1, so all existing selectors shift up by 1 (`:nth-child(1)` → `:nth-child(2)`, through `:nth-child(13)` → `:nth-child(14)`).

### 3. New file — `src/site/terminal-banner.js`

On `DOMContentLoaded`, populate `.banner-last-login` with a formatted timestamp:

```
Last login: Sun Mar 15 12:34:56 2026 on layertwo.dev
```

Format matches a real terminal last-login line. Use the browser's current date at page load time.

## File Changes

| File | Change |
|------|--------|
| `src/site/index.njk` | Add `.banner` div + script tag |
| `src/site/styles.css` | Add banner CSS, shift 13 nth-child indices |
| `src/site/terminal-banner.js` | New file — sets last-login timestamp on load |

## Out of Scope

- No interactivity on the banner
- No server-side date rendering
- No animation on the banner elements
