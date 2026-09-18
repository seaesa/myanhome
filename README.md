# Myan Home — static clone

A plain HTML/CSS/JS rebuild of **myanhome.com.vn** (originally WordPress 7.1.1 +
Flatsome 3.20.4). No framework, no build tooling beyond a few small Node scripts,
no external CDN or webfont — the original uses the system font stack, so this does too.

## Running it

URLs are extensionless (`/gioi-thieu`, not `/gioi-thieu.html`), so the preview
server has to resolve them the way Vercel does:

```bash
node scripts/serve.mjs          # http://localhost:8899
node scripts/serve.mjs 3000     # or pick a port
```

`python3 -m http.server` will **not** work any more — it cannot resolve
extensionless paths. Same reason `file://` no longer works: links are
root-absolute (`/assets/...`, `/category/can-ho`).

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
| `node scripts/serve.mjs [port]` | Local preview with Vercel-style clean URLs |
| `node scripts/build-pages.mjs` | Assembles every `src/pages/*.html` + partials into static HTML |
| `node scripts/verify.mjs` | Checks all pages for unresolved tokens, broken local refs, dead links |
| `node scripts/download-assets.mjs` | Re-downloads anything listed in `docs/research/assets-*.json` |
| `node scripts/gen-categories.mjs` | Regenerates category sources from `categories-bulk.json` |
| `node scripts/gen-posts.mjs` | Regenerates post sources from `posts-all.json` |

After editing a page, run the build, then the verifier.

## Header heights

The live site runs two bar heights and the clone reproduces both:

| Template | Bar | Logo | Fill at scroll 0 |
|---|---|---|---|
| Homepage (`header: transparent`) | 90px | 86×90 | none — fully transparent |
| Every other page | 102px | 98×102 | `rgba(255,255,255,.3)` |
| Stuck (any page) | 52px | 48×52 | `rgba(255,255,255,.3)` |

The stuck bar is a **30% white wash, not an opaque bar** — scrolled over the
hero you can see the photo through it, exactly as on the live site.

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
out: dich-vu.html              ← output path (ships as /dich-vu)
header: transparent            ← optional; only the homepage uses it
-->
```

Every internal `href`/`src`/`action` is written as `{{BASE}}…`. The build
replaces `{{BASE}}` with `/` and then strips the `.html` extension, so
`{{BASE}}category/can-ho.html` ships as `/category/can-ho` and
`{{BASE}}index.html` as `/`. Asset paths keep their extension.

## Behaviour

All interaction lives in `assets/js/main.js`:

- **Sticky header** (`sticky-jump`) — past `scrollY > 0` the wrapper goes
  `fixed` and shrinks to 52px; logo and nav links shrink with it. `#header`
  keeps an explicit height so the page does not jump when it detaches.
- **Dropdowns** — hover opens (180 ms close delay standing in for hoverIntent),
  keyboard focus works, `Escape` closes.
- **Mobile menu** — a full-screen 86%-black overlay at ≤849px with centred
  18px links, a search field and collapsible sub-menus (not a side drawer).
- **Back to top** — `#top-link` fades in past 300px.
- **Sliders** — `[data-slider]`, drag + dots + autoplay; off-screen slides load
  lazily and are promoted to eager just before they scroll in.
- **Carousels** — `[data-carousel]` paged rails.
- **Scroll reveal** — `[data-reveal]` fades up via IntersectionObserver.

Exact measured values for all of this are in `docs/research/BEHAVIORS.md` and
`docs/research/components/header.spec.md`.

## Deploying to Vercel

`vercel.json` sets `cleanUrls: true` and `trailingSlash: false`; `404.html` is
picked up automatically as the not-found page. `.vercelignore` keeps `src/`,
`partials/`, `scripts/` and `docs/` out of the deployment — only the built HTML
and `assets/` ship.

No build step is configured, so Vercel serves the repo root as-is. Run
`node scripts/build-pages.mjs` and commit the output before deploying.

## Fidelity

Measured against the live site at 1440px, `/` matches block-for-block:

```
hero      90/720    intro    810/435    values   1245/363
grid    1684/900    partners 2689/728   gallery  3513/567
news    4256/404    footer    ---/677   document      5337   (live: 5338)
```

The shared chrome — header, footer, grid, buttons, typography, sliders — is
measured from the live site and therefore matches on every page. The inner
pages reproduce the same structure and styling but have **not** been matched
block-by-block the way the homepage has; section heights there still differ
from the original.

## Known gaps

- **Three pages are empty on the live site** and are reproduced as such, with an
  empty content container: `kien-thuc-noi-that`, `portfolio`, `tai-khoan`
  (the last renders an unexpanded `[woocommerce_my_account]` shortcode upstream).
- **Forms are inert** — fields and labels match, but `action="#"`; no backend.
- **Pagination is single-page** — archive page 2+ links point back at page 1,
  since only the first page of each category was captured.
- **71 of 290 posts** are built: every post actually linked from a built page.
  The rest are reachable on the live site only.
- Analytics (GTM/gtag) and the GTranslate widget are not reproduced; the language
  control is a static styled element.
- The live site sets a **sticky-header background image hot-linked from
  `vanchuyenthanhhung24h.com`** (a third-party domain). It fails to load there
  too, so only the 30% white wash shows. The clone reproduces the wash and does
  not hot-link the third-party file.
- Inner-page section heights are not pixel-matched — see **Fidelity** above.
