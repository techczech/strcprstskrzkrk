// Screenshots of the built site for design review: node scripts/screens.mjs <out-dir> [base-url]
// Uses Playwright's headless shell, never the installed Chrome. Starts `astro preview` unless a base URL is given.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";

// Use the newest headless shell already on this machine rather than downloading the exact pinned build.
async function headlessShell() {
  const root = `${os.homedir()}/Library/Caches/ms-playwright`;
  if (!existsSync(root)) return undefined;
  const dirs = (await readdir(root)).filter((d) => d.startsWith("chromium_headless_shell-")).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const d of dirs) {
    const p = `${root}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
    if (existsSync(p)) return p;
  }
}

const out = process.argv[2] ?? "docs/design/screens";
let base = process.argv[3];
let server;
if (!base) {
  server = spawn("npx", ["astro", "preview", "--port", "4329"], { stdio: "ignore" });
  base = "http://localhost:4329";
  for (let i = 0; i < 50; i++) { try { await fetch(base); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
}
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_HEADLESS_SHELL ?? (await headlessShell()) });
const shots = [
  ["home-desktop", "/", { width: 1280, height: 900 }, "light", true],
  ["twister-desktop", "/twisters/strc-prst-skrz-krk/", { width: 1280, height: 900 }, "light", true],
  ["twister-long-desktop-dark", "/twisters/tri-sta-tricet-tri/", { width: 1280, height: 900 }, "dark", false],
  ["sounds-desktop", "/sounds/", { width: 1280, height: 900 }, "light", false],
  ["home-phone", "/", { width: 390, height: 844 }, "light", false],
  ["twister-phone", "/twisters/kmotre-petre/", { width: 390, height: 844 }, "light", true],
];
try {
  for (const [name, path, viewport, scheme, full] of shots) {
    const page = await browser.newPage({ viewport, colorScheme: scheme, deviceScaleFactor: 2 });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
    await page.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
console.log(`Saved ${shots.length} screenshots to ${out}`);
