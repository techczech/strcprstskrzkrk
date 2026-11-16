// Build-time audio for the site. Visitors never call an API: every clip is generated here, committed under
// public/audio/, and listed in src/data/audio-manifest.json.
//
//   node scripts/audio.mjs status     what would change (no key needed)
//   node scripts/audio.mjs generate   create missing or changed clips, delete orphans
//   node scripts/audio.mjs check      transcribe unchecked clips again (--all: every clip) and list mismatches
//
// generate checks each new clip by transcribing it back with Czech speech recognition and retries up to three
// times when what it hears does not match the text; clips that never match are listed by check for a human to hear.
//
// generate and check need OPENAI_API_KEY in the environment; run them through scripts/with-openai-key.sh,
// which hands the key from Bitwarden to this process only. The key is never written to disk or printed.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/audio");
const MANIFEST = path.join(ROOT, "src/data/audio-manifest.json");

// Pinned snapshot, so the same text and settings always come from the same model.
export const MODEL = "gpt-4o-mini-tts-2025-12-15";
const CHECK_MODEL = "gpt-transcribe";
const ATTEMPTS = 3;
export const VOICES = { marin: "Marin", cedar: "Cedar" };

const STYLE = {
  normal:
    "Jsi rodilý mluvčí češtiny z Prahy. Přečti text spisovnou češtinou s přirozenou českou výslovností, klidně, zřetelně a přirozeným tempem. Čti každé slovo jako české slovo, nikdy ho nehláskuj. Nic nepřidávej.",
  slow:
    "Jsi rodilý mluvčí češtiny z Prahy a učíš cizince výslovnost. Přečti text spisovnou češtinou pomalu a velmi zřetelně, s krátkou pauzou mezi slovy, ale pořád přirozeně. Čti každé slovo jako české slovo, nikdy ho nehláskuj. Nic nepřidávej.",
};

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Every clip the site needs, derived from the content files. */
export async function wantedClips() {
  const twisters = JSON.parse(await readFile(path.join(ROOT, "src/data/twisters.json"), "utf8"));
  const sounds = JSON.parse(await readFile(path.join(ROOT, "src/data/sounds.json"), "utf8"));
  const clips = [];
  for (const t of twisters) {
    t.steps.forEach((text, i) => clips.push({ key: `tw/${t.slug}/${i}`, text, style: "normal" }));
    clips.push({ key: `tw/${t.slug}/slow`, text: t.text, style: "slow" });
  }
  for (const s of sounds) {
    const seen = new Set();
    for (const e of s.examples) {
      // byt and být fold to the same slug; the second gets a suffix so both keep their own clip.
      let k = slugify(e.word);
      while (seen.has(k)) k += "-2";
      seen.add(k);
      clips.push({ key: `snd/${s.slug}/${k}`, text: e.word, style: "normal" });
    }
  }
  const out = [];
  for (const voice of Object.keys(VOICES))
    for (const c of clips) {
      const hash = createHash("sha256").update([MODEL, voice, STYLE[c.style], c.text].join("\u0000")).digest("hex").slice(0, 12);
      out.push({ ...c, voice, id: `${voice}|${c.key}`, hash, file: `audio/${voice}/${c.key.replaceAll("/", "--")}-${hash}.mp3` });
    }
  return out;
}

async function loadManifest() {
  try { return JSON.parse(await readFile(MANIFEST, "utf8")); } catch { return { model: MODEL, voices: VOICES, clips: {} }; }
}
async function saveManifest(m) {
  const clips = Object.fromEntries(Object.entries(m.clips).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify({ model: MODEL, voices: VOICES, clips }, null, 2) + "\n");
}

function needKey() {
  if (!process.env.OPENAI_API_KEY) { console.error("OPENAI_API_KEY is not set. Run through scripts/with-openai-key.sh."); process.exit(2); }
  return process.env.OPENAI_API_KEY;
}

async function tts(key, clip) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, voice: clip.voice, input: clip.text, instructions: STYLE[clip.style], response_format: "mp3" }),
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (attempt >= 4 || (r.status < 500 && r.status !== 429)) throw new Error(`TTS ${r.status} for ${clip.id}`);
    await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
}

// A rough sound key: spelling differences that sound the same (word breaks, final devoicing, i/y, ú/ů) compare equal.
export const soundKey = (s) =>
  s.toLowerCase().replace(/[^\p{L}]/gu, "").replace(/ch/g, "x")
    .replace(/[žz]/g, (c) => (c === "ž" ? "š" : "s")).replace(/h/g, "x").replace(/d/g, "t").replace(/ď/g, "ť")
    .replace(/b/g, "p").replace(/v/g, "f").replace(/g/g, "k").replace(/y/g, "i").replace(/ý/g, "í").replace(/ů/g, "ú");
const sameSound = (a, b) => soundKey(a) === soundKey(b);
/** 0..1 closeness of two texts by sound key (1 - edit distance / length). */
function closeness(a, b) {
  const x = Array.from(soundKey(a)), y = Array.from(soundKey(b));
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length, 1);
}

async function transcribe(key, buf) {
  const form = new FormData();
  form.append("model", CHECK_MODEL);
  form.append("language", "cs");
  form.append("file", new Blob([buf], { type: "audio/mpeg" }), "clip.mp3");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!r.ok) throw new Error(`Transcription ${r.status}`);
  return (await r.json()).text ?? "";
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

async function main(cmd) {
  const wanted = await wantedClips();
  const m = await loadManifest();
  // "generate --retry-flagged" also redoes clips whose last check did not match, with more attempts.
  const retry = process.argv.includes("--retry-flagged");
  const todo = wanted.filter((c) => m.clips[c.id]?.hash !== c.hash || !existsSync(path.join(ROOT, "public", c.file)) || (retry && m.clips[c.id]?.check?.match === false));
  const keep = new Set(wanted.map((c) => c.id));
  const orphans = Object.keys(m.clips).filter((id) => !keep.has(id));

  if (cmd === "status") {
    console.log(`${wanted.length} clips wanted, ${todo.length} to generate, ${orphans.length} to remove.`);
    for (const c of todo) console.log(`  + ${c.id}  "${c.text}"`);
    for (const id of orphans) console.log(`  - ${id}`);
    const unchecked = Object.entries(m.clips).filter(([, v]) => !v.check);
    console.log(`${unchecked.length} clips not yet checked by transcription.`);
    return;
  }

  if (cmd === "generate") {
    const key = needKey();
    let done = 0;
    await pool(todo, 4, async (c) => {
      // TTS output varies between calls; keep the first take that transcribes back to the text, else the closest take, flagged.
      let buf, heard = "", best = -1;
      for (let a = 1; a <= (retry ? ATTEMPTS * 2 : ATTEMPTS); a++) {
        const b = await tts(key, c);
        const h = await transcribe(key, b);
        const score = closeness(h, c.text);
        if (score > best) { best = score; buf = b; heard = h; }
        if (sameSound(h, c.text)) break;
      }
      await mkdir(path.dirname(path.join(ROOT, "public", c.file)), { recursive: true });
      await writeFile(path.join(ROOT, "public", c.file), buf);
      const old = m.clips[c.id];
      if (old && old.file !== c.file && existsSync(path.join(ROOT, "public", old.file))) await unlink(path.join(ROOT, "public", old.file));
      m.clips[c.id] = { file: c.file, hash: c.hash, text: c.text, style: c.style, check: { hash: c.hash, heard, match: sameSound(heard, c.text), closeness: Math.round(best * 100) / 100 } };
      done++;
      if (done % 10 === 0) { console.log(`  ${done}/${todo.length}`); await saveManifest(m); }
    });
    for (const id of orphans) {
      const f = path.join(ROOT, "public", m.clips[id].file);
      if (existsSync(f)) await unlink(f);
      delete m.clips[id];
    }
    // Files on disk that the manifest no longer knows about (an interrupted run) go too.
    const known = new Set(Object.values(m.clips).map((v) => path.join(ROOT, "public", v.file)));
    for (const voice of existsSync(OUT) ? await readdir(OUT) : []) {
      for (const f of await readdir(path.join(OUT, voice))) {
        const p = path.join(OUT, voice, f);
        if (!known.has(p)) await unlink(p);
      }
    }
    await saveManifest(m);
    console.log(`Generated ${todo.length}, removed ${orphans.length}.`);
    return;
  }

  if (cmd === "check") {
    const key = needKey();
    const pending = Object.entries(m.clips).filter(([, v]) => process.argv[3] === "--all" || !v.check || v.check.hash !== v.hash);
    await pool(pending, 4, async ([id, v]) => {
      const heard = await transcribe(key, await readFile(path.join(ROOT, "public", v.file)));
      v.check = { hash: v.hash, heard, match: sameSound(heard, v.text) };
    });
    await saveManifest(m);
    const bad = Object.entries(m.clips).filter(([, v]) => v.check && !v.check.match);
    console.log(`Checked ${pending.length}. Mismatches overall: ${bad.length} of ${Object.keys(m.clips).length}.`);
    for (const [id, v] of bad) console.log(`  ${id}\n     text:  ${v.text}\n     heard: ${v.check.heard}`);
    return;
  }

  console.log("Usage: node scripts/audio.mjs status|generate|check");
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv[2]);
