#!/usr/bin/env node
// Static QA over every built page: unresolved template tokens, broken local
// asset/link references, and leftover absolute links to the origin site.
import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['assets', 'docs', 'scripts', 'src', 'partials', 'node_modules', '.git', '.playwright-mcp']);

async function findPages(dir = ROOT, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await findPages(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const exists = async f => { try { await access(f); return true; } catch { return false; } };

const problems = [];
const note = (page, kind, detail) => problems.push({ page, kind, detail });

const pages = (await findPages()).sort();
let refCount = 0;

for (const page of pages) {
  const rel = page.slice(ROOT.length + 1);
  const html = await readFile(page, 'utf8');

  if (html.includes('{{BASE}}')) note(rel, 'unresolved-token', '{{BASE}} left in output');

  // Absolute links back to the live site mean something was not localised.
  for (const m of html.matchAll(/(?:src|href)="(https?:\/\/myanhome\.com\.vn[^"]*)"/g)) {
    note(rel, 'absolute-origin-url', m[1]);
  }

  // Local references must resolve on disk. Page links are root-absolute and
  // extensionless (Vercel `cleanUrls`), so map them back to their .html file.
  for (const m of html.matchAll(/(?:src|href|action)="([^"#][^"]*)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(url)) continue;
    refCount++;

    const clean = url.split('?')[0].split('#')[0];
    if (!clean.startsWith('/')) { note(rel, 'relative-url', url); continue; }

    const candidates = clean === '/'
      ? ['index.html']
      : clean.startsWith('/assets/')
        ? [clean.slice(1)]
        : [clean.slice(1) + '.html', clean.slice(1)];

    let ok = false;
    for (const c of candidates) if (await exists(join(ROOT, c))) { ok = true; break; }
    if (!ok) note(rel, clean.startsWith('/assets/') ? 'missing-asset' : 'dead-link', url);
  }
}

console.log(`checked ${pages.length} page(s), ${refCount} local reference(s)\n`);
for (const p of pages) console.log('  page:', p.slice(ROOT.length + 1));

if (!problems.length) {
  console.log('\nOK — no problems found.');
} else {
  const byKind = {};
  for (const p of problems) (byKind[p.kind] ||= []).push(p);
  console.log(`\n${problems.length} problem(s):`);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`\n  ${kind} (${list.length}):`);
    const seen = new Set();
    for (const p of list) {
      const key = p.page + '|' + p.detail;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`    ${p.page}  →  ${p.detail}`);
    }
  }
  process.exitCode = 1;
}
