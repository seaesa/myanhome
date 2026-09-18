#!/usr/bin/env node
// Downloads every asset listed in docs/research/assets-*.json into assets/images/,
// preserving the site's wp-content path structure so markup can reference stable paths.
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const RESEARCH = join(ROOT, 'docs/research');
const OUT = join(ROOT, 'assets/images');
const ORIGIN = 'https://myanhome.com.vn';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  'Referer': ORIGIN + '/',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
};

/** Maps an absolute site URL to a local path under assets/images/. */
export function localPath(url) {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname);
  p = p.replace(/^\/wp-content\/uploads\//, 'uploads/')
       .replace(/^\/wp-content\/plugins\//, 'plugins/')
       .replace(/^\/wp-content\/themes\//, 'themes/')
       .replace(/^\/+/, '');
  return p;
}

const exists = async f => { try { await access(f); return true; } catch { return false; } };

async function fetchOne(url, attempt = 1) {
  const rel = localPath(url);
  const dest = join(OUT, rel);
  if (await exists(dest)) return { url, rel, skipped: true };
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error('empty body');
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    return { url, rel, bytes: buf.length };
  } catch (err) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 400 * attempt));
      return fetchOne(url, attempt + 1);
    }
    return { url, rel, error: err.message };
  }
}

async function main() {
  const files = readdirSync(RESEARCH).filter(f => /^assets-.*\.json$/.test(f));
  const urls = new Set();
  for (const f of files) {
    const data = JSON.parse(await readFile(join(RESEARCH, f), 'utf8'));
    for (const u of data.assets || []) urls.add(u);
  }

  const list = [...urls].filter(u => {
    if (!u.startsWith(ORIGIN)) return false;
    // Skip non-asset URLs that leaked in from data-* attributes.
    return /\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|ico|woff2?|ttf|otf)$/i.test(new URL(u).pathname);
  });

  console.log(`${list.length} assets from ${files.length} manifest(s)`);
  const results = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    results.push(...await Promise.all(batch.map(u => fetchOne(u))));
    process.stdout.write(`\r${Math.min(i + CONCURRENCY, list.length)}/${list.length}`);
  }
  console.log('');

  const failed = results.filter(r => r.error);
  const got = results.filter(r => r.bytes);
  const skipped = results.filter(r => r.skipped);
  console.log(`downloaded ${got.length}, cached ${skipped.length}, failed ${failed.length}`);
  for (const f of failed) console.log('  FAIL', f.error, f.url);
  await writeFile(join(RESEARCH, 'asset-map.json'),
    JSON.stringify(Object.fromEntries(results.filter(r => !r.error).map(r => [r.url, 'assets/images/' + r.rel])), null, 1));
}

main();
