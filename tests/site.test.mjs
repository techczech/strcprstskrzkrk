// Content and build checks. Run after `npm run build`: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { wantedClips } from "../scripts/audio.mjs";

const root = path.resolve(import.meta.dirname, "..");
const twisters = JSON.parse(readFileSync(path.join(root, "src/data/twisters.json"), "utf8"));
const sounds = JSON.parse(readFileSync(path.join(root, "src/data/sounds.json"), "utf8"));
const manifest = JSON.parse(readFileSync(path.join(root, "src/data/audio-manifest.json"), "utf8"));

test("every back-chaining step is the end of its twister, and the last step is the whole twister", () => {
  for (const t of twisters) {
    const plain = t.text.replace(/[.]$/, "").toLowerCase();
    for (const s of t.steps.slice(0, -1)) assert.ok(plain.endsWith(s.replace(/[.]$/, "").toLowerCase()), `${t.slug}: "${s}"`);
    assert.equal(t.steps.at(-1), t.text, t.slug);
  }
});

test("sound pages link only to twisters that exist", () => {
  const slugs = new Set(twisters.map((t) => t.slug));
  for (const s of sounds) for (const x of s.twisters) assert.ok(slugs.has(x), `${s.slug} -> ${x}`);
});

test("every wanted clip is in the manifest with its file on disk and current hash", async () => {
  for (const c of await wantedClips()) {
    const m = manifest.clips[c.id];
    assert.ok(m, `missing ${c.id}`);
    assert.equal(m.hash, c.hash, `stale ${c.id}: run npm run audio:generate`);
    assert.ok(existsSync(path.join(root, "public", m.file)), `no file for ${c.id}`);
  }
});

const dist = path.join(root, "dist");
const files = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? files(p) : [p]; });

test("the build has no API calls, keys or external scripts", { skip: !existsSync(dist) && "run npm run build first" }, () => {
  for (const f of files(dist).filter((f) => /\.(html|js|json|txt|md)$/.test(f))) {
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /api\.openai\.com|generativelanguage|googleapis|@google\/genai|api-proxy|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}/, f);
    assert.doesNotMatch(s, /<script[^>]+src="https?:/, f);
  }
});

test("the sound key applies Czech voicing in context only", async () => {
  const { soundKey } = await import("../scripts/audio.mjs");
  const same = (a, b) => soundKey(a) === soundKey(b);
  assert.ok(same("skrz krk", "skrs krk"), "z before k devoices");
  assert.ok(same("Smrž pln", "Smrš pln"), "ž before p devoices");
  assert.ok(same("z mlh", "zmlch"), "final h is ch; word breaks do not count");
  assert.ok(!same("plky", "blky"), "p before l stays voiceless");
  assert.ok(same("od čaje", "ot čaje"), "d before č devoices");
  assert.ok(same("z cukru", "s cukru"), "z before c devoices");
  assert.ok(!same("naolejuji", "naolejuje"), "vowels differ");
});
