// web-design-elements kit: search.ts v1
// Building blocks for the site search dialog: accent folding, an all-terms match, safe highlighting, a tiny
// DOM builder and listbox keyboard navigation for a combobox input. The site keeps its own index shape,
// grouping and row layout; results are built as DOM nodes, never as HTML strings.
import { scrollIntoViewSafe } from "./motion";

/** Lower-case and strip combining accents, so "lukes" finds "Lukeš". */
export const fold = (s: string): string => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const terms = (q: string): string[] => fold(q).split(/\s+/).filter(Boolean);

/** True when every term occurs in the folded haystack. */
export const matchesAll = (hay: string, ts: string[]): boolean => {
  const f = fold(hay);
  return ts.every((t) => f.includes(t));
};

type Child = Node | string | null | undefined | false;

/** Element builder: attributes are set with setAttribute, children appended as nodes or text. Never parses HTML. */
export function h(tag: string, attrs: Record<string, string | number | null | undefined | false> = {}, ...kids: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const c of kids) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

/** The text with the first matching term wrapped in <mark>, as a fragment. Terms shorter than minLen are ignored. */
export function highlight(text: string, ts: string[], minLen = 2): DocumentFragment {
  const frag = document.createDocumentFragment();
  const f = fold(text);
  for (const t of ts) {
    if (t.length < minLen) continue;
    const i = f.indexOf(t);
    // Folding keeps the length for precomposed letters; when it does not, offsets would be wrong, so skip the mark.
    if (i > -1 && f.length === text.length) {
      frag.append(text.slice(0, i), h("mark", {}, text.slice(i, i + t.length)), text.slice(i + t.length));
      return frag;
    }
  }
  frag.append(text);
  return frag;
}

export type Listbox = { reset(): void; index(): number; current(): HTMLElement | null };

/** Arrow-key selection over the options in list, driven from a combobox input (aria-activedescendant). Options need ids. */
export function listboxNav(input: HTMLInputElement, list: HTMLElement, optionSel = "[role=option]"): Listbox {
  let sel = 0;
  const opts = () => Array.from(list.querySelectorAll<HTMLElement>(optionSel));
  const mark = (scroll = true) => {
    const o = opts();
    o.forEach((a, i) => a.setAttribute("aria-selected", String(i === sel)));
    if (scroll && o[sel]) scrollIntoViewSafe(o[sel], { block: "nearest", behavior: "instant" });
    if (o[sel]?.id) input.setAttribute("aria-activedescendant", o[sel].id);
    else input.removeAttribute("aria-activedescendant");
  };
  input.addEventListener("keydown", (e) => {
    const n = opts().length;
    if (e.key === "ArrowDown") { e.preventDefault(); if (sel < n - 1) sel++; mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (sel > 0) sel--; mark(); }
  });
  list.addEventListener("mousemove", (e) => {
    const o = (e.target as Element).closest<HTMLElement>(optionSel);
    const i = o ? opts().indexOf(o) : -1;
    if (i > -1 && i !== sel) { sel = i; mark(false); }
  });
  return { reset() { sel = 0; mark(); }, index: () => sel, current: () => opts()[sel] ?? null };
}

const cache = new Map<string, Promise<unknown>>();
/** Fetches a JSON index once per page. A failed fetch is not cached, so the next open retries. */
export function loadJSON<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    const p = fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url) as Promise<T>;
}
