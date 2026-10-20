// Route list -> page records -> HTML, sitemap and 404 writers, plus the Vite plugin that runs them.
import fs from 'node:fs';
import path from 'node:path';

const HEAD_TAG_PATTERNS = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name="description"[^>]*>\s*/gi,
  /<meta\s+name="robots"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/gi,
  /<meta\s+property="og:(?:title|description|url|type|site_name)"[^>]*>\s*/gi,
];

export const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const pageUrl = (origin, pagePath) => origin + (pagePath === '/' ? '/' : pagePath);

export const headTags = (page, origin, siteName) => {
  const url = pageUrl(origin, page.path);
  const lines = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    page.noindex ? '<meta name="robots" content="noindex" />' : null,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
  ].filter(Boolean);
  return lines.join('\n    ');
};

const stripHeadTags = (html) => HEAD_TAG_PATTERNS.reduce((h, re) => h.replace(re, ''), html);

export const renderPageHtml = (template, page, bodyHtml, { origin, siteName }) => {
  let html = stripHeadTags(template);
  const tags = headTags(page, origin, siteName);
  // After the viewport meta so the charset declaration stays first in the head.
  html = /<meta\s+name="viewport"[^>]*>/i.test(html)
    ? html.replace(/(<meta\s+name="viewport"[^>]*>)/i, (m) => `${m}\n    ${tags}`)
    : html.replace(/<head>/i, () => `<head>\n    ${tags}`);
  if (!/<div id="root"><\/div>/.test(html)) throw new Error('template has no empty <div id="root"></div>');
  return html.replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`);
};

// Plain page with no app script, served with status 404 by the Express server.
export const render404Html = (template, { origin, siteName }) => {
  const page = {
    path: '/404',
    title: `Page not found · ${siteName}`,
    description: 'This page does not exist.',
    noindex: true,
  };
  const noScripts = template.replace(/<script type="module"[^>]*><\/script>\s*/gi, '');
  const body = `<main style="max-width:40rem;margin:4rem auto;padding:0 1rem;font-family:sans-serif"><h1>Page not found</h1><p>There is no page at this address.</p><p><a href="/">Go to the ${escapeHtml(siteName)} home page</a></p></main>`;
  return renderPageHtml(noScripts, page, body, { origin, siteName }).replace(/<link rel="canonical"[^>]*>\s*/i, '');
};

export const renderSitemap = (pages, origin, date) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages
    .filter((p) => !p.noindex)
    .map((p) => `  <url><loc>${escapeHtml(pageUrl(origin, p.path))}</loc><lastmod>${date}</lastmod></url>\n`)
    .join('') +
  `</urlset>\n`;

export const outputPathFor = (distDir, pagePath) =>
  pagePath === '/' ? path.join(distDir, 'index.html') : path.join(distDir, pagePath.replace(/^\//, ''), 'index.html');

// copyDirs: folders at the project root that the app loads by URL but Vite does not bundle (e.g. audio).
export function readablePagesPlugin({ origin, siteName, entry, copyDirs = [] }) {
  let outDir = 'dist';
  let root = process.cwd();
  return {
    name: 'readable-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      root = config.root;
    },
    async closeBundle() {
      for (const dir of copyDirs) {
        const from = path.join(root, dir);
        if (fs.existsSync(from)) fs.cpSync(from, path.join(outDir, dir), { recursive: true });
      }
      const { createServer } = await import('vite');
      const { default: react } = await import('@vitejs/plugin-react');
      const server = await createServer({
        root,
        configFile: false,
        logLevel: 'silent',
        appType: 'custom',
        plugins: [react()],
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
        // react-router-dom 7 is a thin re-export; use react-router's ESM build so there is one router instance.
        resolve: { alias: { 'react-router-dom': 'react-router' } },
        ssr: { noExternal: ['react-router'] },
      });
      try {
        const mod = await server.ssrLoadModule(entry);
        const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
        const opts = { origin, siteName };
        for (const page of mod.pages) {
          const file = outputPathFor(outDir, page.path);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, renderPageHtml(template, page, mod.renderRoute(page.path), opts));
        }
        fs.writeFileSync(path.join(outDir, '404.html'), render404Html(template, opts));
        fs.writeFileSync(
          path.join(outDir, 'sitemap.xml'),
          renderSitemap(mod.pages, origin, new Date().toISOString().slice(0, 10))
        );
      } finally {
        await server.close();
      }
    },
  };
}
