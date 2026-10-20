import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPageHtml, renderSitemap, render404Html, outputPathFor } from './readable-pages.mjs';

const template = `<!DOCTYPE html><html><head><title>Old</title><meta name="description" content="old" /><script type="module" src="/a.js"></script></head><body><div id="root"></div></body></html>`;
const opts = { origin: 'https://x.test', siteName: 'X' };
const page = { path: '/roles', title: 'Roles · X', description: 'Say "hi" & <go>.' };

test('page html gets tags once and a filled root', () => {
  const html = renderPageHtml(template, page, '<h1>Roles</h1>', opts);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.match(html, /<title>Roles · X<\/title>/);
  assert.match(html, /content="Say &quot;hi&quot; &amp; &lt;go&gt;\."/);
  assert.match(html, /<link rel="canonical" href="https:\/\/x\.test\/roles" \/>/);
  assert.match(html, /<div id="root"><h1>Roles<\/h1><\/div>/);
  assert.doesNotMatch(html, /content="old"/);
});

test('home canonical keeps the single slash', () => {
  assert.match(renderPageHtml(template, { ...page, path: '/' }, '', opts), /href="https:\/\/x\.test\/"/);
});

test('sitemap leaves out noindex pages', () => {
  const xml = renderSitemap([page, { path: '/n', title: 't', description: 'd', noindex: true }], opts.origin, '2026-01-01');
  assert.match(xml, /https:\/\/x\.test\/roles/);
  assert.doesNotMatch(xml, /\/n</);
});

test('404 page has noindex, no canonical and no app script', () => {
  const html = render404Html(template, opts);
  assert.match(html, /name="robots" content="noindex"/);
  assert.doesNotMatch(html, /canonical|type="module"/);
});

test('output paths', () => {
  assert.equal(outputPathFor('d', '/'), 'd/index.html');
  assert.equal(outputPathFor('d', '/roles'), 'd/roles/index.html');
});
