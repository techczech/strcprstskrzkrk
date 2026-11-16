// Page behaviour: audio buttons, voice choice, shortcuts, search, practice record and the recorder.
// Everything here runs in the visitor's browser only; no network calls except fetching the site's own files.
import { initDialogs, openDialog } from "./kit/dialog";
import { initKeyboard, bindSingleKeysSwitch } from "./kit/keys";
import { cycleTheme } from "./kit/theme";
import { readPref, writePref } from "./kit/storage";
import { toast } from "./kit/toast";
import { scrollToSafe } from "./kit/motion";
import { initSearch, openSearch, toggleSearch } from "./search";
import { initRecorder, toggleRecording } from "./recorder";
import { initProgress } from "./progress";

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));

// ---- Voice -----------------------------------------------------------------------------------------------
const voiceButtons = () => $$<HTMLButtonElement>("[data-voice-set]");
export function voice(): string {
  const ids = voiceButtons().map((b) => b.dataset.voiceSet!);
  const v = readPref("voice");
  return v && ids.includes(v) ? v : ids[0] ?? "marin";
}
function setVoice(v: string, announce = false) {
  writePref("voice", v);
  voiceButtons().forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.voiceSet === v)));
  if (announce) toast(`Voice: ${voiceButtons().find((b) => b.dataset.voiceSet === v)?.textContent ?? v}`);
}

// ---- Audio -----------------------------------------------------------------------------------------------
const player = new Audio();
let current: HTMLElement | null = null;
let onEnd: (() => void) | null = null;

function stop() {
  player.pause();
  current?.classList.remove("is-playing");
  current?.setAttribute("aria-pressed", "false");
  current = null;
  onEnd = null;
}
export function srcFor(el: HTMLElement): string | null {
  return el.getAttribute(`data-a-${voice()}`) ?? el.getAttribute("href");
}
/** Plays a URL and marks the button that started it. Resolves when playback ends or is stopped. */
export function playUrl(url: string, btn: HTMLElement | null): Promise<void> {
  stop();
  return new Promise((resolve) => {
    current = btn;
    btn?.classList.add("is-playing");
    btn?.setAttribute("aria-pressed", "true");
    onEnd = resolve;
    player.src = url;
    player.play().catch(() => { toast("The audio could not play. Try again.", { error: true }); const r = onEnd; stop(); r?.(); });
  });
}
player.addEventListener("ended", () => { const r = onEnd; stop(); r?.(); });
player.addEventListener("error", () => { if (!current) return; toast("The audio could not load. Try again.", { error: true }); const r = onEnd; stop(); r?.(); });

function initPlayButtons() {
  for (const a of $$("[data-play]")) {
    a.setAttribute("role", "button");
    a.setAttribute("aria-pressed", "false");
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (current === a) { const r = onEnd; stop(); r?.(); return; }
      const url = srcFor(a);
      if (url) playUrl(url, a);
    });
    // Links do not activate with Space; buttons do.
    a.addEventListener("keydown", (e) => { if (e.key === " ") { e.preventDefault(); a.click(); } });
  }
}

// ---- Shortcuts -------------------------------------------------------------------------------------------
function initKeys() {
  const keysDlg = $<HTMLDialogElement>("#keys-dlg");
  const map: Record<string, string> = JSON.parse(keysDlg?.dataset.keys || "{}");
  const openKeys = () => openDialog(keysDlg, { focus: "[data-close]" });
  $$("[data-open-keys]").forEach((b) => b.addEventListener("click", openKeys));
  const sw = keysDlg ? $<HTMLInputElement>("[data-single-keys]", keysDlg) : null;
  if (sw) bindSingleKeysSwitch(sw);
  const click = (sel: string) => () => { const el = $(sel); if (el) el.click(); };
  initKeyboard({
    search: () => openSearch(),
    toggleSearch,
    help: openKeys,
    keys: {
      ...map,
      m: () => { const t = cycleTheme(); if (t) toast(`Theme: ${t}`); },
      v: () => { const ids = voiceButtons().map((b) => b.dataset.voiceSet!); if (ids.length) setVoice(ids[(ids.indexOf(voice()) + 1) % ids.length], true); },
      p: click("[data-key-play]"),
      l: click("[data-key-slow]"),
      r: () => toggleRecording(),
      n: click("[data-key-next]"),
      b: click("[data-key-prev]"),
    },
  });
}

function initTopButton() {
  const fab = $(".fab-top");
  if (!fab) return;
  fab.addEventListener("click", () => { scrollToSafe(window, { top: 0 }); $<HTMLElement>("#main")?.focus({ preventScroll: true }); });
  const on = () => fab.classList.toggle("show", window.scrollY > 900);
  window.addEventListener("scroll", on, { passive: true });
  on();
}

function measureHeader() {
  const head = $(".site-head");
  if (!head || !("ResizeObserver" in window)) return;
  new ResizeObserver(() => document.documentElement.style.setProperty("--head-h", `${head.getBoundingClientRect().height}px`)).observe(head);
}

export function initSite() {
  setVoice(voice());
  voiceButtons().forEach((b) => b.addEventListener("click", () => setVoice(b.dataset.voiceSet!)));
  initDialogs();
  initPlayButtons();
  initKeys();
  initSearch();
  initTopButton();
  measureHeader();
  initProgress();
  initRecorder({ playUrl, srcFor, stop });
}
