#!/usr/bin/env node
// Local preview server that mirrors Vercel's `cleanUrls`: /gioi-thieu serves
// gioi-thieu.html, / serves index.html, unknown paths serve 404.html.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8899);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

const isFile = async p => { try { return (await stat(p)).isFile(); } catch { return false; } };

/** Resolves a request path the way Vercel's cleanUrls does. */
async function resolveFile(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  // Refuse to escape the project root.
  const rel = clean.replace(/^\/+/, '');
  const base = resolve(ROOT, rel);
  if (!base.startsWith(ROOT)) return null;

  if (clean === '/' || clean === '') return join(ROOT, 'index.html');
  for (const cand of [base, base + '.html', join(base, 'index.html')]) {
    if (await isFile(cand)) return cand;
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url);
  if (!file) {
    const notFound = join(ROOT, '404.html');
    const body = await isFile(notFound) ? await readFile(notFound) : 'Not found';
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(body);
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
}).listen(PORT, () => {
  console.log(`Myan Home → http://localhost:${PORT}`);
});
