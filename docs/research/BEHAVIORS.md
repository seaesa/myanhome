# Myan Home — Behavior Bible

Source: https://myanhome.com.vn/ (WordPress 7.1.1 + Flatsome 3.20.4 theme, child theme `flatsome-child`).
All values below are from `getComputedStyle()` on the live site at 1440px unless noted.

---

## 1. Header — the critical component

Markup root: `<header id="header" class="header has-transparent has-sticky sticky-jump transparent">`
Inner: `.header-wrapper > #masthead.header-main > .header-inner.flex-row.container.logo-left.medium-logo-center`

Root var on `<html>`: `--flatsome--header--sticky-height: 52px`

### 1.1 Scroll behavior — "sticky-jump"

**INTERACTION MODEL: scroll-driven.** Two classes toggle:
- `#header` carries `.transparent` **only** while at the very top; it is removed once scrolled.
- `.header-wrapper` gains `.stuck` once scrolled.

| Property | State A (top, `.transparent`) | State B (scrolled, `.stuck`) |
|---|---|---|
| `.header-wrapper` position | `relative` | `fixed` (top:0) |
| `.header-wrapper` height | `90px` | `52px` |
| `.header-wrapper` box-shadow | `none` | `rgba(0,0,0,.15) 1px 1px 10px 0px` |
| `#masthead` height | `90px` | `52px` |
| `.header-inner` height | `90px` | `52px` |
| `#logo a` height | `90px` | `52px` |
| `#logo img` width / max-height | `86px` / `90px` | `48px` / `52px` |
| nav `a.nav-top-link` height | `36px` | `25px` |

- `#header` itself stays `position: absolute; height: 90px; z-index: 1001` in both states —
  it is a 90px spacer; the `.header-wrapper` inside it is what detaches and shrinks.
- `#header` background-color is `rgba(0,0,0,0)` in **both** states, and `#masthead` keeps
  `box-shadow: rgba(0,0,0,.15) 2px 2px 10px 0px` in both. The visible white bar comes from
  `#masthead` background (white) — see 1.2.
- `#header` transition: `background-color .3s, opacity .3s`.
- Logo image transition: `max-height .5s` (top state) — this is what animates the shrink.
- **Trigger:** `.stuck` is applied by Flatsome's sticky JS as soon as the wrapper's natural
  top passes the viewport top (i.e. `scrollY > 0` in practice; the probe loop found the class
  already applied before 5px, so treat the threshold as `scrollY > 0`). `sticky-jump` means the
  header does **not** slide — it jumps straight to the fixed/compact state.

### 1.2 Transparent variant

The homepage uses `page-template-page-transparent-header`. `has-transparent` makes `#header`
`position: absolute` so `#main` starts at `y=0` underneath it. On this page the first section
is the hero slider, so the header overlays the top of the slider.

### 1.3 Nav links

`#header .header-nav-main > li.menu-item > a.nav-top-link`

- font-size `17px`, font-weight `700`, line-height `16px`, padding `10px 0`, `display:inline-flex`
- transition `0.2s`
- color **normal**: `rgb(0,0,0)`
- color **:hover**: `rgb(237,119,2)`  (#ED7702)
- color **current page** (`li.active`): `rgb(237,119,2)`
- No `::before` / `::after` underline — `content: none` on both. Colour change only.
- Items with children render a trailing `<i class="icon-angle-down">` caret.

### 1.4 Dropdowns

`li.has-dropdown > ul.sub-menu.nav-dropdown.nav-dropdown-simple`

**INTERACTION MODEL: hover-driven** (Flatsome adds `.current-dropdown` to the `<li>` via hoverIntent).

| Property | Closed | Open (`li.current-dropdown`) |
|---|---|---|
| `opacity` | `0` | `1` |
| `visibility` | `hidden` | `visible` |
| `left` | `-99999px` | `-15px` |

- transition: `opacity .25s, visibility .25s`
- `position: absolute; top: 39.1953px; z-index: 9; display: table; min-width: 260px`
- background `#fff`, `border-top: 4px solid rgb(249,109,0)` (#F96D00)
- `box-shadow: rgba(0,0,0,.15) 1px 1px 15px 0px`
- Dropdown links: color `rgb(66,66,66)`, font-size `15.2px`, font-weight 400,
  line-height `19.76px`, padding `10px 20px`, `display:block`, transition `0.2s`.

> Note: the live site hides the panel by moving it off-canvas with `left:-99999px`. The clone
> reproduces the same timing with `opacity/visibility` plus `left`, so hover-in/out feels identical.

### 1.5 Search dropdown

`li.header-search.header-search-dropdown` — an icon (`icon-search`) that opens
`ul#ux-search-dropdown.nav-dropdown` containing the search form. Same open/close mechanics as 1.4.

### 1.6 Mobile header

- Breakpoint: Flatsome `medium` = **≤849px**. `.show-for-medium` appears, `.hide-for-medium` hides.
- Logo becomes centered (`medium-logo-center`), hamburger (`i.icon-menu`) sits left.
- Hamburger targets `#main-menu.mobile-sidebar` (an off-canvas panel, `data-open="#main-menu"`,
  `data-pos="center"`), which lives as a direct child of `<body>`.

---

## 2. Global

- Container: `max-width: 1170px`, `padding: 0 15px`.
- Body: `16px / 25.6px`, color `rgb(10,10,10)`, system font stack
  (`-apple-system, system-ui, "Segoe UI", Roboto, …`) — **no webfont is loaded**.
- H1 `27.2px/35.36px` weight 400 color `#F96D00`; H2 `25.6px/33.28px` weight 400 color `#F96D00`.
- Brand orange: **#F96D00** (headings, accents, buttons); nav hover/active orange **#ED7702**.
- Page height at 1440px: 5338px.
- Lazy loading: Flatsome's own (`img.lazy-load-active` with `data-src`). The clone uses
  native `loading="lazy"` instead — same visual result, no orange placeholder flash.

## 3. Sections (homepage, top → bottom)

| # | Section | Notes |
|---|---|---|
| 1 | Hero slider | Flickity slider, full-bleed, circle nav, dots. Header overlays it. |
| 2 | Giới thiệu về Myan Home | 2-col: text + CTA buttons (SHOWROOM / NHÀ MÁY SẢN XUẤT) left, image right. GTranslate widget pill above. |
| 3 | 4 value cards | AN TOÀN / THẨM MỸ / CHẤT LƯỢNG / MINH BẠCH — icon + title + copy. |
| 4 | Dự án nổi bật | `banner-grid` masonry (Packery): 4 banners w/ label chips + "TẤT CẢ DỰ ÁN" button. |
| 5 | Đối tác chiến lược | Logo slider (An Cường, Häfele, Blum, Vietceramics, Vicostone …). |
| 6 | CTA + form | Orange panel left (phone numbers), Contact Form 7 on right. |
| 7 | Phản hồi của khách hàng | Testimonial slider. |
| 8 | Tin tức | 4 post cards, each with a date chip (day over month). |
| 9 | Liên hệ CTA banner | Full-bleed dark image + phone numbers. |
| 10 | Footer | Showroom list, factory list, logo, socials, bottom nav + copyright. |

## 4. Third-party widgets present on live site

- **GTranslate** language pill (`.gtranslate_wrapper`) — rendered as a static styled control in the clone.
- **Sticky chat widget** (`#gsb-buttons-*`) — floating right-side call/Zalo/Messenger buttons.
- Google Tag Manager / gtag — **not** reproduced (analytics, not UI).

## 5. Responsive breakpoints (Flatsome)

- `small`: ≤549px
- `medium`: ≤849px  ← main desktop→mobile switch
- `large`: ≥850px

---

## Corrections from the 2026-09-18 verification pass

Re-measured against the live site; these supersede the earlier notes.

### Header

| Property | Value |
|---|---|
| Bar height, transparent template (home) | **90px** |
| Bar height, every other page | **102px** |
| Bar height, stuck | 52px |
| Logo | `height: var(--hh); padding: 2px 0; box-sizing: border-box` → 86×90 / 98×102 / 48×52 |
| `#header` position | `relative` with an explicit height — without it the page jumps a full bar height when `.header-wrapper` goes `fixed` |
| `.header-main` background | **transparent**; the fill is a separate `.header-bg-color` layer |
| `.header-bg-color` | `rgba(255,255,255,.3)` — a 30% wash, *not* an opaque bar |
| …on the transparent template at scroll 0 | `transparent` (the `#header.transparent` class switches it off) |
| `.header-main` box-shadow | `2px 2px 10px rgba(0,0,0,.15)` in **both** states |
| `.header-wrapper.stuck` box-shadow | `1px 1px 10px rgba(0,0,0,.15)` |
| Nav `li` | `margin: 0 9px` (first/last trimmed); the link has **no** horizontal padding |
| Nav link | 17px/700, `padding: 10px 0`, `line-height: 16px`, colour `#000`, current/hover `#ed7702` |
| Caret | `icon-angle-down`, 16px, `margin-left: 3.2px`, 10px wide |
| Search icon | 20.4px |

At 1440 the menu therefore runs 487→1290 (803px wide), which the clone reproduces to 1px.

The live site also points `.header-bg-image` at a file on **vanchuyenthanhhung24h.com**,
a third-party domain. It 404s/blocks there, so only the wash renders. Not reproduced.

### Buttons

All one primitive: `0.97em` / 700 / `letter-spacing: .03em` / uppercase /
`padding: 0 1.2em` / `min-height: 2.5em` / `margin-bottom: 1em` /
`transition: … .3s`. Pill (`99px`) is the **default**; `input[type=submit]` and
the homepage project-grid captions are square.

| Variant | Rest | Hover |
|---|---|---|
| solid | bg `#f96d00`, `#fff` | bg `#d85f00` |
| `primary is-outline` | 2px `#f96d00`, text `#f96d00`, `line-height: 2.19em` | bg `#f96d00`, text `#fff` |
| `white is-outline` | 2px `#f1f1f1`, text `#f1f1f1` | bg `#fff`, text `#666` |

No transform on hover — the live site only cross-fades colours.

### Grid

- A **top-level** `.row` *is* the container: `max-width: 1170px; margin: 0 auto`.
- A row inside a `.col` or a `.container` is nested: negative gutters instead.
- `.col` padding is `0 15px 30px` — the 30px bottom is part of the gutter.
- `row-large` = 1200/30px, `row-small` = 10px, `row-collapse` = 1140/0.
- Inside a `.container` the `row-large` pull-back is capped at 15px, otherwise
  it hangs off both edges on narrow screens.

### Type

Headings are `font-weight: 400`; the bold comes from a `<b>`/`<strong>` child,
so the markup has to keep it. Section titles are 25.6px; the inner-page variant
adds `letter-spacing: .05em` and renders its span at 105%.

The `<p>` / `<span>` font-size mismatch matters: on the value cards the `<p>`
keeps a 16px/25.6px strut while the `<span>` inside sets the visible size. That
mismatch is what makes each line box 25.6px and the cards land on 273px.

Below 550px headings drop to 75% (h2 25.6 → 19.2px). Body copy does not scale.

### Mobile (≤849px)

- Hamburger left, logo centred, **"Gọi Ngay" pill** right (`secondary is-small`,
  10.88px/700, 99px radius).
- The menu is a **full-screen overlay**, not a side drawer: `rgba(17,2,2,.86)`,
  centred 18px/28.8px uppercase links in 53px rows, a search field on top and a
  40px close button top-right.
- The hero keeps a 2:1 aspect ratio at every width (1440×720, 390×195) and sits
  under a 30px band of page background on small screens.
