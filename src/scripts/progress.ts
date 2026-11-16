// "Practised" marks, kept in this browser only (localStorage, optional). Without storage the buttons still
// confirm the click, but nothing is remembered.
import { readPref, writePref } from "./kit/storage";
import { toast } from "./kit/toast";

type Entry = { n: number; last: number };
const KEY = "practised";

function load(): Record<string, Entry> {
  try { return JSON.parse(readPref(KEY) || "{}"); } catch { return {}; }
}
function ago(t: number): string {
  const d = Math.floor((Date.now() - t) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}
const line = (e?: Entry) => (e ? `Practised ${e.n === 1 ? "once" : `${e.n} times`}, last ${ago(e.last)}.` : "Not marked as practised yet.");

export function initProgress() {
  const data = load();
  document.querySelectorAll<HTMLElement>("[data-done-badge]").forEach((el) => { el.hidden = !data[el.dataset.doneBadge!]; });
  const btn = document.querySelector<HTMLButtonElement>("[data-mark-done]");
  const status = document.querySelector<HTMLElement>("[data-done-status]");
  if (!btn || !status) return;
  const slug = btn.dataset.markDone!;
  status.textContent = line(data[slug]);
  btn.addEventListener("click", () => {
    const all = load();
    all[slug] = { n: (all[slug]?.n ?? 0) + 1, last: Date.now() };
    const saved = writePref(KEY, JSON.stringify(all));
    status.textContent = saved ? line(all[slug]) : "Well done. This browser does not allow saving, so the count is not kept.";
    toast(saved ? "Marked as practised" : "Well done");
  });
}
