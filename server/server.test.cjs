// Starts server.js in a temp dir with a fake dist and probes routing, redirects and injection.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const html = (t) => `<!DOCTYPE html><html><head><title>${t}</title></head><body><div id="root">${t}</div></body></html>`;

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'srv-test-'));
  fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(dir, 'server.js'));
  fs.cpSync(path.join(__dirname, 'public'), path.join(dir, 'public'), { recursive: true });
  fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(dir, 'node_modules'));
  fs.mkdirSync(path.join(dir, 'dist/roles'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'dist/assets'));
  fs.writeFileSync(path.join(dir, 'dist/index.html'), html('home'));
  fs.writeFileSync(path.join(dir, 'dist/roles/index.html'), html('roles'));
  fs.writeFileSync(path.join(dir, 'dist/404.html'), html('missing'));
  fs.writeFileSync(path.join(dir, 'dist/assets/a.js'), 'console.log(1)');
  return dir;
}

function start(dir, port, apiKey) {
  const env = { ...process.env, PORT: String(port) };
  delete env.API_KEY; delete env.GEMINI_API_KEY;
  if (apiKey) env.API_KEY = apiKey;
  const child = spawn('node', ['server.js'], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    child.stdout.on('data', (d) => /listening/.test(String(d)) && resolve(child));
    child.on('error', reject);
  });
}

// Raw request so the path is sent exactly as written.
const get = (port, p) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: p }, (res) => {
    let body = ''; res.on('data', (c) => (body += c));
    res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }));
  }).on('error', reject);
});

for (const [label, key, port] of [['with API key', 'dummy', 39711], ['without API key', '', 39712]]) {
  test(`routing ${label}`, async (t) => {
    const dir = setup();
    const child = await start(dir, port, key);
    t.after(() => { child.kill(); fs.rmSync(dir, { recursive: true, force: true }); });

    const injected = (r) => r.body.includes('websocket-interceptor.js');

    let r = await get(port, '/');
    assert.equal(r.status, 200); assert.match(r.body, /home/); assert.equal(injected(r), !!key);
    r = await get(port, '/roles');
    assert.equal(r.status, 200); assert.match(r.body, /roles/); assert.equal(injected(r), !!key);

    r = await get(port, '/roles/');
    assert.equal(r.status, 301); assert.equal(r.location, '/roles');
    r = await get(port, '/roles/index.html');
    assert.equal(r.status, 301); assert.equal(r.location, '/roles');
    r = await get(port, '/index.html');
    assert.equal(r.status, 301); assert.equal(r.location, '/');
    r = await get(port, '/roles/?a=1');
    assert.equal(r.location, '/roles?a=1');

    for (const bad of ['//evil.com/', '//evil.com', '/\\evil.com/', '/%5Cevil.com/', '/%2F%2Fevil.com/', '/%2e%2e/', '/../etc/passwd']) {
      r = await get(port, bad);
      assert.equal(r.status, 404, bad); assert.equal(r.location, undefined, bad);
    }
    r = await get(port, '/nope');
    assert.equal(r.status, 404); assert.match(r.body, /missing/);
    r = await get(port, '/nope/');
    assert.equal(r.status, 404);
    r = await get(port, '/assets/a.js');
    assert.equal(r.status, 200); assert.equal(r.body, 'console.log(1)');
  });
}
