#!/usr/bin/env node
// Generates src/pages/category-<slug>.html from the real archive data captured
// in docs/research/categories-bulk.json.
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DATA = join(ROOT, 'docs/research/categories-bulk.json');
const IMG_ROOT = join(ROOT, 'assets/images');

// Which top-level nav item each category belongs to.
const NAV = {
  'can-ho': 'du-an', 'nha-pho': 'du-an', 'penthouse-duplex': 'du-an',
  'biet-thu': 'du-an', 'hinh-anh-thuc-te': 'du-an',
  'noi-that-do-roi': 'noi-that-do-roi', 'sofa': 'noi-that-do-roi',
  'ban-ghe-an': 'noi-that-do-roi', 'ban-tra': 'noi-that-do-roi',
  'giuong': 'noi-that-do-roi', 'ke-tivi': 'noi-that-do-roi',
  'thiet-ke-noi-that': 'dich-vu', 'cac-phong-cach': 'tin-tuc',
};

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Must mirror download-assets.mjs, which decodes the pathname before writing.
const localPath = url => {
  const p = decodeURIComponent(new URL(url).pathname);
  return p.replace(/^\/wp-content\/uploads\//, 'uploads/').replace(/^\/+/, '');
};

const exists = async f => { try { await access(f); return true; } catch { return false; } };

const data = JSON.parse(await readFile(DATA, 'utf8'));
let made = 0, missing = 0;

for (const [slug, cat] of Object.entries(data)) {
  if (cat.error) { console.log('  skip (fetch error):', slug); continue; }

  const cards = [];
  for (const c of cat.cards) {
    if (!c.img || !c.slug) continue;
    const rel = localPath(c.img);
    if (!(await exists(join(IMG_ROOT, rel)))) { missing++; console.log('  MISSING asset:', rel); continue; }
    cards.push(`          <article class="blog-post">
            <a class="box-image" href="{{BASE}}post/${c.slug}.html">
              <img src="{{BASE}}assets/images/${rel}" alt="${esc(c.title)}"${c.w ? ` width="${c.w}"` : ''}${c.h ? ` height="${c.h}"` : ''} loading="lazy">
            </a>
            <div class="box-text">
              <h2 class="post-title"><a href="{{BASE}}post/${c.slug}.html">${esc(c.title)}</a></h2>
            </div>
          </article>`);
  }

  const pagination = cat.pages.length > 1
    ? `        <ul class="nav-pagination">
${cat.pages.map((p, i) => p === '…'
        ? '          <li><span class="page-number dots">…</span></li>'
        : i === 0
          ? `          <li><span class="page-number current" aria-current="page">${esc(p)}</span></li>`
          : `          <li><a class="page-number" href="{{BASE}}category/${slug}.html">${esc(p)}</a></li>`
      ).join('\n')}
        </ul>`
    : '';

  const body = cards.length
    ? `        <div class="post-columns">
${cards.join('\n')}
        </div>
${pagination}`
    : `        <p class="archive-empty">Chưa có bài viết trong danh mục này.</p>`;

  const page = `<!--meta
title: Lưu trữ ${cat.title} - Myan Home
description: Danh mục ${cat.title} – Myan Home.
body: archive category category-${slug}
nav: ${NAV[slug] || ''}
css: pages archive
out: category/${slug}.html
-->

    <section class="section archive-head">
      <div class="container">
        <h1>${esc(cat.title)}</h1>
      </div>
    </section>

    <section class="section archive-body">
      <div class="container">
${body}
      </div>
    </section>
`;

  await writeFile(join(ROOT, `src/pages/category-${slug}.html`), page);
  console.log(`  ✓ category-${slug}.html  (${cards.length} cards${cat.pages.length > 1 ? ', paginated' : ''})`);
  made++;
}

console.log(`\ngenerated ${made} category source(s)${missing ? `, ${missing} card(s) dropped for missing assets` : ''}`);
