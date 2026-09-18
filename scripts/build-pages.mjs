#!/usr/bin/env node
// Assembles static pages from src/pages/*.html bodies + shared partials.
// Output is plain HTML with no runtime templating, so pages work over file://.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src/pages');
const PARTIALS = join(ROOT, 'partials');

const read = f => readFile(f, 'utf8');

/** Parses the `<!--meta ... -->` block at the top of a body file. */
function parseMeta(src) {
  const m = src.match(/^<!--meta([\s\S]*?)-->/);
  if (!m) return [{}, src];
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*([a-zA-Z]+)\s*:\s*(.*?)\s*$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return [meta, src.slice(m[0].length).trimStart()];
}

/**
 * Rewrites internal page links to their extensionless form:
 *   /index.html        -> /
 *   /gioi-thieu.html   -> /gioi-thieu
 *   /category/x.html   -> /category/x
 * Asset paths and external URLs are left alone.
 */
function cleanUrls(s) {
  return s.replace(/(href|src|action)="(\/[^"]*?)"/g, (m, attr, url) => {
    if (url.startsWith('/assets/')) return m;
    if (url === '/index.html') return `${attr}="/"`;
    if (url.endsWith('/index.html')) return `${attr}="${url.slice(0, -'index.html'.length)}"`;
    if (url.endsWith('.html')) return `${attr}="${url.slice(0, -5)}"`;
    return m;
  });
}

/** Marks the current nav item so it renders in the active colour. */
function markActive(header, navKey) {
  if (!navKey) return header;
  return header.replace(
    new RegExp(`(<li class="menu-item)( has-dropdown)?(" data-nav="${navKey}">)`),
    (_, a, b = '', c) => `${a}${b} active${c}`
  );
}

async function main() {
  const [headerTpl, footerTpl, menuTpl] = await Promise.all([
    read(join(PARTIALS, 'header.html')),
    read(join(PARTIALS, 'footer.html')),
    read(join(PARTIALS, 'mobile-menu.html')),
  ]);

  const files = (await readdir(SRC)).filter(f => f.endsWith('.html'));
  let built = 0;

  for (const file of files) {
    const raw = await read(join(SRC, file));
    const [meta, body] = parseMeta(raw);

    const out = meta.out || file;                 // e.g. "category/du-an.html"

    // Root-absolute paths, so a page's own depth never matters, and Vercel's
    // `cleanUrls` can serve every page without its .html extension.
    const BASE = '/';

    const sub = s => cleanUrls(s.replaceAll('{{BASE}}', BASE));
    const header = sub(markActive(headerTpl, meta.nav));
    const extraCss = (meta.css || '')
      .split(/\s+/).filter(Boolean)
      .map(n => `\n<link rel="stylesheet" href="${BASE}assets/css/${n}.css">`).join('');

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title || 'Myan Home'}</title>
<meta name="description" content="${meta.description || ''}">
<link rel="icon" href="${BASE}assets/images/uploads/2024/07/logo150.png" sizes="32x32">
<link rel="apple-touch-icon" href="${BASE}assets/images/uploads/2024/07/6815116.png">
<link rel="stylesheet" href="${BASE}assets/css/icons.css">
<link rel="stylesheet" href="${BASE}assets/css/base.css">
<link rel="stylesheet" href="${BASE}assets/css/header.css">
<link rel="stylesheet" href="${BASE}assets/css/footer.css">${extraCss}
</head>
<body class="${meta.body || 'page'}">

<a class="skip-link screen-reader-text" href="#main">Chuyển tới nội dung</a>

<div id="wrapper">

${header}

  <main id="main">
${sub(body).trimEnd()}
  </main>

${sub(footerTpl)}
</div><!-- /#wrapper -->

${sub(menuTpl)}
<script src="${BASE}assets/js/main.js"></script>
</body>
</html>
`;

    const dest = join(ROOT, out);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html);
    console.log('  ✓', relative(ROOT, dest));
    built++;
  }
  console.log(`built ${built} page(s)`);
}

main();
