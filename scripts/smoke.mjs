// Headless interaction check against a deployed or local site: node scripts/smoke.mjs <base-url>
import { chromium } from "playwright-core";
import { readdirSync, existsSync } from "node:fs";
import os from "node:os";
const base = process.argv[2] ?? "http://localhost:4321";
const root = `${os.homedir()}/Library/Caches/ms-playwright`;
const shell = readdirSync(root).filter((d) => d.startsWith("chromium_headless_shell-")).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
  .map((d) => `${root}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`).find(existsSync);
const browser = await chromium.launch({ executablePath: process.env.PW_HEADLESS_SHELL ?? shell, args: ["--autoplay-policy=no-user-gesture-required"] });
const results = [];
const ok = (name, cond) => results.push(`${cond ? "PASS" : "FAIL"}  ${name}`);
try {
  const page = await browser.newPage();
  const errors = [], external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("request", (r) => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
  await page.goto(base + "/twisters/strc-prst-skrz-krk/", { waitUntil: "networkidle" });
  await page.keyboard.press("p");
  await page.waitForTimeout(600);
  ok("p plays the twister", await page.locator("[data-key-play].is-playing").count() === 1);
  await page.locator(".ladder [data-play]").first().click();
  await page.waitForTimeout(800);
  ok("a ladder button takes over playback", await page.locator(".is-playing").count() === 1 && await page.locator(".ladder .is-playing").count() === 1);
  await page.locator("[data-voice-set=cedar]").click();
  const src = await page.evaluate(() => document.querySelector("[data-key-play]").getAttribute("data-a-cedar"));
  await page.keyboard.press("p"); await page.waitForTimeout(400);
  ok("voice switch stored", await page.evaluate(() => localStorage.getItem("voice")) === "cedar" && !!src);
  await page.keyboard.press("/");
  await page.keyboard.type("pstros");
  const found = await page.locator(".s-item", { hasText: "pštros" }).first().waitFor({ timeout: 8000 }).then(() => true, () => false);
  ok("search finds the ostrich twister", found);
  await page.keyboard.press("Escape");
  ok("Esc closes search", !(await page.evaluate(() => document.querySelector("#search-dlg").open)));
  await page.keyboard.press("?");
  ok("? opens the shortcuts sheet", await page.evaluate(() => document.querySelector("#keys-dlg").open));
  await page.keyboard.press("Escape");
  await page.locator("input[type=search]").focus().catch(() => {});
  await page.keyboard.press("m");
  ok("m switches theme", (await page.evaluate(() => document.documentElement.dataset.theme)) === "light");
  await page.locator("[data-mark-done]").click();
  ok("practised mark saved", (await page.locator("[data-done-status]").textContent()).startsWith("Practised once"));
  const went = await Promise.all([page.waitForURL(/\/twisters\/vlky-plky\//, { timeout: 8000 }).then(() => true, () => false), page.keyboard.press("n")]);
  ok("n goes to the next twister", went[0]);
  await page.goto(base + "/", { waitUntil: "networkidle" });
  ok("home shows practised badge for one twister", await page.locator("[data-done-badge]:visible").count() === 1);
  ok("no page errors", errors.length === 0);
  ok("no requests to other hosts", external.length === 0);
  if (errors.length) console.log(errors);
  if (external.length) console.log(external);
  const phone = await browser.newPage({ viewport: { width: 360, height: 740 } });
  for (const p of ["/", "/twisters/tri-sta-tricet-tri/", "/sounds/"]) {
    await phone.goto(base + p, { waitUntil: "networkidle" });
    ok(`no horizontal scroll at 360px on ${p}`, await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
} finally { await browser.close(); }
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
