# Header Specification

## Overview
- **Target files:** `partials/header.html`, `assets/css/header.css`, `initStickyHeader`/`initDropdowns`/`initMobileMenu` in `assets/js/main.js`
- **Screenshot:** `docs/design-references/home-desktop-full.png`
- **Interaction model:** scroll-driven (stick/shrink) + hover-driven (dropdowns) + click-driven (mobile drawer, search)

## DOM Structure
```
header#header.header.has-transparent.has-sticky.sticky-jump[.transparent]
└ .header-wrapper[.stuck]
  └ #masthead.header-main
    └ .header-inner.container.flex-row.logo-left.medium-logo-center
      ├ #logo.flex-col                      → <a><img class="header-logo"></a>
      ├ .flex-col.show-for-medium.flex-left → ul.mobile-nav (hamburger)
      ├ .flex-col.hide-for-medium.flex-left.flex-grow (empty spacer)
      └ .flex-col.hide-for-medium.flex-right
        └ ul.header-nav.header-nav-main.nav-right
          ├ li.menu-item[.active] > a.nav-top-link
          ├ li.menu-item.has-dropdown > a.nav-top-link + ul.nav-dropdown
          └ li.header-search.has-dropdown > a + ul#ux-search-dropdown
```

## Computed Styles

### #header
`position: relative` · `height: 90px` · `z-index: 1001` · `background: transparent`
`transition: background-color .3s, opacity .3s`

> The live markup is flagged `has-transparent`, but measurement shows the first
> section starting at **y = 90**, so the bar sits *above* the hero, not over it.
> Keeping `#header` in flow also serves as the placeholder for the sticky wrapper.

### #masthead.header-main
`background: #fff` · `box-shadow: 2px 2px 10px 0 rgba(0,0,0,.15)` (both states)
`height: 90px` → `52px` when stuck · `transition: height .3s`

### #logo img
`max-height: 90px` → `52px` · `width: auto` · `transition: max-height .5s`

### a.nav-top-link
`display: inline-flex` · `height: 36px` → `25px` · `padding: 10px 0` · `margin: 0 11px`
`font-size: 17px` · `font-weight: 700` · `line-height: 16px` · `text-transform: uppercase`
`color: #000` · `transition: .2s`

### ul.nav-dropdown
`position: absolute` · `top: 39.2px` · `z-index: 9` · `display: table` · `min-width: 260px`
`background: #fff` · `border-top: 4px solid #F96D00` · `box-shadow: 1px 1px 15px 0 rgba(0,0,0,.15)`
`transition: opacity .25s, visibility .25s`

### ul.nav-dropdown li > a
`display: block` · `padding: 10px 20px` · `color: #424242` · `font-size: 15.2px`
`font-weight: 400` · `line-height: 19.76px` · `transition: .2s`

## States & Behaviors

### Scroll — "sticky-jump"
- **Trigger:** `window.pageYOffset > 0`
- **State A:** `#header.transparent`; `.header-wrapper` `position: relative`, `height: 90px`, `box-shadow: none`
- **State B:** `transparent` removed; `.header-wrapper.stuck` `position: fixed; top: 0`, `height: 52px`,
  `box-shadow: 1px 1px 10px 0 rgba(0,0,0,.15)`
- Heights that follow: `#masthead`, `.header-inner`, `#logo a` 90→52; `#logo img` max-height 90→52;
  `a.nav-top-link` height 36→25
- **Implementation:** rAF-throttled passive scroll listener toggling two classes; all size
  changes are CSS transitions. No slide-in — the wrapper jumps straight to compact.

### Hover — dropdowns
- **Trigger:** `mouseenter` on `li.has-dropdown` adds `.current-dropdown` (180 ms close delay
  on leave, standing in for the original's hoverIntent); `focusin`/`focusout` mirror it for keyboards.
- **Closed:** `opacity: 0`, `visibility: hidden`, `left: -99999px`
- **Open:** `opacity: 1`, `visibility: visible`, `left: -15px`
- Last two items open right-aligned (`right: -15px`) so they stay on screen. They still *hide*
  to the left — hiding to the right widens the document.
- `Escape` closes all dropdowns.

### Hover — nav links
- `color: #000` → `#ED7702`, `transition: .2s`. Current page (`li.active`) is `#ED7702` permanently.
- No underline: `::before`/`::after` are `content: none` on the original.

### Click — search
- `a` in `li.header-search` toggles `.current-dropdown` and focuses the input. Never navigates.

### Click — mobile drawer (≤849px)
- `[data-open="#main-menu"]` → `#main-menu.is-open` (`transform: translateX(-100%)` → `0`, `.3s ease`),
  overlay fades in, `body` scroll locked, `aria-expanded` synced.
- Closes on overlay click or `Escape`. Sub-menus collapse/expand per item.

## Assets
- Logo: `assets/images/uploads/2025/11/LOGO-MYAN-HOME-1-1-1024x1024.png`
- Icons: `.icon-menu`, `.icon-search`, `.icon-angle-down/-left/-right` — inline SVG masks in
  `assets/css/icons.css` (replacing the theme's icon font), coloured by `currentColor`.

## Responsive Behavior
- **Desktop (≥850px):** logo left, full nav right, dropdowns on hover.
- **≤849px (Flatsome `medium`):** `.hide-for-medium` hidden, `.show-for-medium` shown;
  logo centres (`order: 2`, `flex: 1`), hamburger left; nav moves to the off-canvas drawer.
- **≤549px (`small`):** unchanged header; page content stacks.

## Verification (1440px, measured on both sites)
| Property | Original | Clone |
|---|---|---|
| wrapper position top / stuck | relative / fixed | relative / fixed |
| wrapper height top / stuck | 90 / 52 | 90 / 52 |
| wrapper shadow stuck | .15 1px 1px 10px | .15 1px 1px 10px |
| masthead shadow | .15 2px 2px 10px | .15 2px 2px 10px |
| logo max-height top / stuck | 90 / 52 | 90 / 52 |
| nav link height top / stuck | 36 / 25 | 36 / 25 |
| nav link size / weight | 17px / 700 | 17px / 700 |
| nav hover colour | rgb(237,119,2) | rgb(237,119,2) |
| dropdown top / min-width | 39.2px / 260px | 39.2px / 260px |
| dropdown border-top | 4px solid rgb(249,109,0) | 4px solid rgb(249,109,0) |
| dropdown transition | opacity .25s, visibility .25s | opacity .25s, visibility .25s |
| dropdown link colour / size | rgb(66,66,66) / 15.2px | rgb(66,66,66) / 15.2px |

Known deviation: logo image renders 90px wide vs the original's 86px at the same 90px height
(the original's box is slightly narrower than the square source). ~4px, visually indistinguishable.
