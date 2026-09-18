#!/usr/bin/env node
// Generates src/pages/post-<slug>.html for every post captured in
// docs/research/posts-all.json: keeps the prose and every image, drops the
// theme's wrapper markup.
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const IMG_ROOT = join(ROOT, 'assets/images');
const DATA = join(ROOT, 'docs/research/posts-all.json');

// Category slugs that actually have a generated archive page.
const KNOWN_CATEGORIES = new Set([
  'can-ho', 'nha-pho', 'penthouse-duplex', 'biet-thu', 'hinh-anh-thuc-te',
  'noi-that-do-roi', 'sofa', 'ban-ghe-an', 'ban-tra', 'giuong', 'ke-tivi',
  'thiet-ke-noi-that', 'cac-phong-cach', 'du-an',
]);

const exists = async f => { try { await access(f); return true; } catch { return false; } };

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const localRel = url => decodeURIComponent(new URL(url, 'https://myanhome.com.vn').pathname)
  .replace(/^\/wp-content\/uploads\//, 'uploads/').replace(/^\/+/, '');

/** Turns a Flatsome entry-content blob into ordered prose + image groups. */
function parseBody(rawHtml) {
  const images = [];
  let body = rawHtml;

  for (const m of body.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const src = (tag.match(/\bdata-src="([^"]+)"/) || tag.match(/\bsrc="([^"]+)"/) || [])[1];
    if (!src || src.startsWith('data:')) continue;
    images.push({
      src,
      w: (tag.match(/\bwidth="(\d+)"/) || [])[1],
      h: (tag.match(/\bheight="(\d+)"/) || [])[1],
      alt: (tag.match(/\balt="([^"]*)"/) || [])[1] || '',
    });
  }

  let i = 0;
  body = body.replace(/<img\b[^>]*>/g, tag => {
    const src = (tag.match(/\bdata-src="([^"]+)"/) || tag.match(/\bsrc="([^"]+)"/) || [])[1];
    if (!src || src.startsWith('data:')) return '';
    return `\n@@IMG${i++}@@\n`;
  });

  body = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/g, '')
    .replace(/<\/?a\b[^>]*>/g, '')
    .replace(/<(?!\/?(?:h2|h3|h4|h5|p|ul|ol|li|strong|b|em|i|br)\b)[^>]*>/g, '\n')
    .replace(/<b\b[^>]*>/g, '<strong>').replace(/<\/b>/g, '</strong>')
    .replace(/<i\b[^>]*>/g, '<em>').replace(/<\/i>/g, '</em>')
    .replace(/<(h2|h3|h4|h5|p|ul|ol|li)\b[^>]*>/g, '<$1>');

  const blocks = [];
  let group = [];
  const flush = () => { if (group.length) { blocks.push({ type: 'images', items: group }); group = []; } };

  for (const line of body.split('\n').map(s => s.trim()).filter(Boolean)) {
    if (/^(@@IMG\d+@@)+$/.test(line)) {
      for (const m of line.matchAll(/@@IMG(\d+)@@/g)) group.push(images[Number(m[1])]);
      continue;
    }
    flush();
    const text = line.replace(/\s+/g, ' ').trim();
    if (!text || /^<(p|h[2-5]|ul|ol|li)><\/\1>$/.test(text)) continue;
    blocks.push({ type: 'text', text });
  }
  flush();
  return { blocks, total: images.length };
}

async function renderImages(items, fallbackAlt) {
  const figures = [];
  for (const im of items) {
    const rel = localRel(im.src);
    if (!(await exists(join(IMG_ROOT, rel)))) continue;
    figures.push(`            <figure class="gallery-item">
              <img src="{{BASE}}assets/images/${rel}" alt="${esc(im.alt || fallbackAlt)}"${im.w ? ` width="${im.w}"` : ''}${im.h ? ` height="${im.h}"` : ''} loading="lazy">
            </figure>`);
  }
  if (!figures.length) return '';
  const cols = Math.min(figures.length, 3);
  return `          <div class="post-gallery cols-${cols}">\n${figures.join('\n')}\n          </div>`;
}

const data = JSON.parse(await readFile(DATA, 'utf8'));
let made = 0, skipped = 0, droppedImgs = 0, totalImgs = 0;

for (const [slug, post] of Object.entries(data)) {
  if (post.status !== 200 || !post.html) { skipped++; continue; }

  const { blocks, total } = parseBody(post.html);
  totalImgs += total;

  // Map the live category URL onto a generated archive page.
  let cat = null;
  if (post.category?.href) {
    const seg = post.category.href.replace(/\/+$/, '').split('/').pop();
    if (KNOWN_CATEGORIES.has(seg)) cat = { label: post.category.label, slug: seg };
  }

  const parts = [];
  let rendered = 0;
  for (const b of blocks) {
    if (b.type === 'images') {
      const html = await renderImages(b.items, post.title);
      if (html) { parts.push(html); rendered += (html.match(/<figure/g) || []).length; }
      continue;
    }
    parts.push('          ' + b.text);
  }
  droppedImgs += total - rendered;

  const nav = cat && ['sofa', 'ban-ghe-an', 'ban-tra', 'giuong', 'ke-tivi', 'noi-that-do-roi'].includes(cat.slug)
    ? 'noi-that-do-roi'
    : cat && ['cac-phong-cach'].includes(cat.slug) ? 'tin-tuc'
    : cat && cat.slug === 'thiet-ke-noi-that' ? 'dich-vu'
    : 'du-an';

  const page = `<!--meta
title: ${post.title} - Myan Home
description: ${post.title} – Myan Home.
body: single single-post
nav: ${nav}
css: pages post
out: post/${slug}.html
-->

    <section class="section post-header">
      <div class="container">
${cat ? `        <p class="entry-category"><a href="{{BASE}}category/${cat.slug}.html">${esc(cat.label)}</a></p>\n` : ''}        <h1>${esc(post.title)}</h1>
${post.date ? `        <p class="post-meta">${esc(post.date)}</p>\n` : ''}      </div>
    </section>

    <section class="section content-section">
      <div class="container">
        <div class="content-body">
${parts.filter(Boolean).join('\n')}
        </div>
      </div>
    </section>
`;

  await writeFile(join(ROOT, `src/pages/post-${slug}.html`), page);
  made++;
}

console.log(`generated ${made} post source(s), skipped ${skipped}`);
console.log(`images: ${totalImgs} referenced, ${droppedImgs} dropped (file not on disk)`);
