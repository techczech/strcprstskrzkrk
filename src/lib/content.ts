// Content helpers: the fixed data files, the audio manifest and the letter marks used on every twister.
import twistersData from "../data/twisters.json";
import soundsData from "../data/sounds.json";
import manifest from "../data/audio-manifest.json";

export type Twister = (typeof twistersData)[number];
export type Sound = (typeof soundsData)[number];
export const twisters: Twister[] = twistersData;
export const sounds: Sound[] = soundsData;

export const VOICES = manifest.voices as Record<string, string>;
const clips = manifest.clips as Record<string, { file: string }>;

/** URLs of one clip in every voice, as data attributes for an audio button. Missing clips are left out. */
export function audioAttrs(key: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of Object.keys(VOICES)) {
    const c = clips[`${v}|${key}`];
    if (c) out[`data-a-${v}`] = `/${c.file}`;
  }
  return out;
}
export const firstAudio = (key: string): string | undefined => Object.values(audioAttrs(key))[0];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const VOWELS = new Set("aáeéěiíoóuúůyýAÁEÉĚIÍOÓUÚŮYÝ");
const HACEK = new Set("řŘšŠčČžŽ");
const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);
const isCons = (c: string | undefined) => isLetter(c) && !VOWELS.has(c!);

export type Part = { t: string; k?: "hacek" | "syl" };
/** Splits a Czech text so the hard letters can be marked: ř, š, č, ž, and r or l that carry a syllable. */
export function marks(text: string): Part[] {
  const out: Part[] = [];
  const chars = Array.from(text);
  chars.forEach((c, i) => {
    let k: Part["k"];
    if (HACEK.has(c)) k = "hacek";
    else if (/[rlRL]/.test(c) && isCons(chars[i - 1]) && (isCons(chars[i + 1]) || !isLetter(chars[i + 1]))) k = "syl";
    const last = out[out.length - 1];
    if (!k && last && !last.k) last.t += c;
    else out.push(k ? { t: c, k } : { t: c });
  });
  return out;
}

export const levelClass = (l: string) => `lvl-${slugify(l)}`;
