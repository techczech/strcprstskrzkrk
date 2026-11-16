// Site search: native dialog, build-time index, accent-insensitive, grouped by section. Results are DOM nodes.
import { openDialog, closeDialog, isOpen } from "./kit/dialog";
import { h, highlight, listboxNav, loadJSON, matchesAll, terms as toTerms, type Listbox } from "./kit/search";

type Item = { s: string; t: string; d: string; u: string; k?: string };
type Index = { sections: { slug: string; name: string }[]; items: Item[] };

let dlg: HTMLDialogElement | null = null;
let input: HTMLInputElement, body: HTMLElement, meta: HTMLElement, nav: Listbox;

async function render() {
  let idx: Index;
  try { idx = await loadJSON<Index>("/search-index.json"); }
  catch { meta.textContent = "Search is not available right now. Try again, or use the links at the top."; return; }
  const q = input.value.trim();
  const ts = toTerms(q);
  dlg!.querySelector<HTMLElement>(".s-clear")!.hidden = !q;
  const hits = q ? idx.items.filter((it) => matchesAll(`${it.t} ${it.d} ${it.k ?? ""}`, ts)) : idx.items;
  let n = 0;
  const groups: HTMLElement[] = [];
  for (const sec of idx.sections) {
    const g = hits.filter((it) => it.s === sec.slug);
    if (!g.length) continue;
    const group = h("div", { class: "s-group", role: "group", "aria-label": sec.name }, h("h3", {}, `${sec.name} (${g.length})`));
    for (const it of g) group.append(h("a", { class: "s-item", role: "option", id: `s-opt-${n++}`, href: it.u, "aria-selected": "false" }, h("b", {}, highlight(it.t, ts)), h("span", {}, highlight(it.d, ts))));
    groups.push(group);
  }
  if (groups.length) body.replaceChildren(...groups);
  else body.replaceChildren(h("p", { class: "s-empty" }, `Nothing matches “${q}”. Try a Czech word without accents, such as strc or pstros, or a sound such as r.`));
  meta.textContent = q ? `${hits.length} ${hits.length === 1 ? "result" : "results"}` : `Everything on the site · ${idx.items.length} entries`;
  nav.reset();
}

export function openSearch(q?: string) {
  if (!dlg) return;
  openDialog(dlg, { focus: "input" });
  if (typeof q === "string") input.value = q;
  render();
}
export const toggleSearch = () => (isOpen(dlg) ? closeDialog(dlg) : openSearch());

export function initSearch() {
  dlg = document.querySelector<HTMLDialogElement>("#search-dlg");
  if (!dlg) return;
  input = dlg.querySelector("input")!;
  body = dlg.querySelector(".s-body")!;
  meta = dlg.querySelector(".s-meta")!;
  nav = listboxNav(input, body, ".s-item");
  input.addEventListener("input", render);
  dlg.querySelector(".s-clear")!.addEventListener("click", () => { input.value = ""; render(); input.focus(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const cur = nav.current(); if (cur) { e.preventDefault(); cur.click(); closeDialog(dlg); } }
    else if (e.key === "Escape") { e.preventDefault(); closeDialog(dlg); }
  });
  body.addEventListener("click", (e) => { if ((e.target as Element).closest(".s-item")) closeDialog(dlg); });
  document.querySelectorAll("[data-open-search]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openSearch(); }));
  if (location.pathname.replace(/\/$/, "") === "/search") openSearch(new URLSearchParams(location.search).get("q") ?? undefined);
}
