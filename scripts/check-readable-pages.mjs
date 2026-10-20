// Reads every generated HTML file in dist and fails if a public page is not readable without JavaScript.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(d, e.name));
    else if (e.name.endsWith('.html')) files.push(path.join(d, e.name));
  }
};
walk(dist);

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const rows = [];
let failed = false;
for (const file of files.sort()) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(dist, file);
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '');
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/i) || [])[1] || '';
  const noindex = /<meta name="robots" content="noindex"/i.test(html);
  const root = (html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/i) || [])[1] || '';
  const text = root.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const problems = [];
  if (!noindex) {
    if (!title) problems.push('empty title');
    if (!desc) problems.push('empty description');
    if (!canonical) problems.push('no canonical');
    if (text.length < 200) problems.push('under 200 chars of text');
  }
  if (problems.length) failed = true;
  rows.push({ file: rel, title, descLen: desc.length, canonical: canonical || '-', textChars: text.length, noindex, problems: problems.join('; ') || 'ok' });
}
console.table(rows);
if (failed) { console.error('FAILED'); process.exit(1); }
