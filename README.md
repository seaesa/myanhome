# Myan Home — static clone

A plain HTML/CSS/JS rebuild of **myanhome.com.vn** (originally WordPress 7.1.1 +
Flatsome 3.20.4). No framework, no build tooling beyond two small Node scripts,
no external CDN or webfont — the original uses the system font stack, so this does too.

## Running it

Any static server works:

```bash
python3 -m http.server 8899
# then open http://localhost:8899/index.html
```

Pages also open directly over `file://`, since every internal link is relative.

## Layout

```
index.html, gioi-thieu.html, …   12 top-level pages  (generated)
category/<slug>.html             14 category pages   (generated)
post/<slug>.html                 71 post pages       (generated)

src/pages/*.html                 page bodies + meta  ← edit these
partials/                        header, footer, mobile menu  ← edit these
assets/css/                      stylesheets
assets/js/main.js                all behaviour
assets/images/                   2,212 downloaded assets
scripts/                         build + generators + verifier
docs/research/                   captured DOM, extracted specs, behaviour notes
docs/design-references/          screenshots
```

**Do not edit the HTML files in the root, `category/` or `post/`** — they are
build output and get overwritten. Edit `src/pages/` and `partials/` instead.

## Scripts

| Command | What it does |
|---|---|
| `node scripts/build-pages.mjs` | Assembles every `src/pages/*.html` + partials into static HTML |
| `node scripts/verify.mjs` | Checks all pages for unresolved tokens, broken local refs, dead links |
| `node scripts/download-assets.mjs` | Re-downloads anything listed in `docs/research/assets-*.json` |
| `node scripts/gen-categories.mjs` | Regenerates category sources from `categories-bulk.json` |
| `node scripts/gen-posts.mjs` | Regenerates post sources from `posts-all.json` |

After editing a page, run the build, then the verifier.

## How a page is defined

Each file in `src/pages/` starts with a meta block, then the body markup that
gets injected into `<main id="main">`:

```html
<!--meta
title: DỊCH VỤ - Myan Home
description: …
body: page page-dich-vu        ← <body> classes
nav: dich-vu                   ← which top-nav item renders as active
css: pages dich-vu             ← extra stylesheets from assets/css/
out: dich-vu.html              ← output path (depth sets {{BASE}})
-->
```

Every internal `href`/`src` is written as `{{BASE}}…`; the build replaces it with
`""` for root pages and `"../"` for `category/` and `post/` pages.

## Behaviour

All interaction lives in `assets/js/main.js`:

- **Sticky header** (`sticky-jump`) — past `scrollY > 0` the wrapper goes
  `fixed` and shrinks 90px → 52px, logo and nav links shrink with it.
- **Dropdowns** — hover opens (180 ms close delay standing in for hoverIntent),
  keyboard focus works, `Escape` closes.
- **Mobile drawer** — off-canvas at ≤849px, overlay, scroll lock, collapsible sub-menus.
- **Sliders** — `[data-slider]`, drag + dots + autoplay; off-screen slides load
  lazily and are promoted to eager just before they scroll in.
- **Carousels** — `[data-carousel]` paged rails.
- **Scroll reveal** — `[data-reveal]` fades up via IntersectionObserver.

Exact measured values for all of this are in `docs/research/BEHAVIORS.md` and
`docs/research/components/header.spec.md`.

## Known gaps

- **Three pages are empty on the live site** and are reproduced as such:
  `kien-thuc-noi-that.html`, `portfolio.html`, `tai-khoan.html`
  (the last renders an unexpanded `[woocommerce_my_account]` shortcode upstream).
- **Forms are inert** — fields and labels match, but `action="#"`; no backend.
- **Pagination is single-page** — archive page 2+ links point back at page 1,
  since only the first page of each category was captured.
- **71 of 290 posts** are built: every post actually linked from a built page.
  The rest are reachable on the live site only.
- Analytics (GTM/gtag) and the GTranslate widget are not reproduced; the language
  control is a static styled element.
