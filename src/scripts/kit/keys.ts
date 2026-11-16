// web-design-elements kit: keys.ts v1
// The website keymap: Cmd/Ctrl+K toggles search; "/" opens search; "?" opens the shortcuts sheet; single letters
// go to sections or run small actions. Single-character keys are skipped while the reader types, while any
// modifier other than Shift is held, and while a dialog is open. They can be turned off from the "?" sheet
// (WCAG 2.1.4); the choice is kept when storage allows. Cmd/Ctrl+K and Esc are never turned off. Browser and
// system chords (Cmd/Ctrl+F, L, T, W, R, P, S and the like) are never bound.
import { anyOpen } from "./dialog";
import { readPref, writePref } from "./storage";

export type KeyAction = string | (() => void);
export type KeyHandlers = {
  /** Opens search ("/"). */
  search?: () => void;
  /** Opens or closes search (Cmd/Ctrl+K). Falls back to search. */
  toggleSearch?: () => void;
  /** Opens the shortcuts sheet ("?"). Also reachable from a visible button, so the sheet survives the off switch. */
  help?: () => void;
  /** Lower-case letter to a path (navigates) or a function. */
  keys?: Record<string, KeyAction>;
};

const PREF = "single-keys";
const OFF_CLASS = "single-keys-off";

export const singleKeysOn = (): boolean => readPref(PREF) !== "off";

export function setSingleKeys(on: boolean): void {
  writePref(PREF, on ? null : "off");
  document.documentElement.classList.toggle(OFF_CLASS, !on);
}

export function isTyping(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.closest("dialog:not([open])")) return false; // focus left behind in a closed dialog
  return t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
}

export function initKeyboard(h: KeyHandlers): void {
  document.documentElement.classList.toggle(OFF_CLASS, !singleKeysOn());
  const toggle = h.toggleSearch ?? h.search;
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.isComposing) return;
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k" && toggle) {
      e.preventDefault(); toggle(); return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || anyOpen() || !singleKeysOn()) return;
    if (e.key === "/" && h.search) { e.preventDefault(); h.search(); return; }
    if (e.key === "?" && h.help) { e.preventDefault(); h.help(); return; }
    if (e.shiftKey || e.key.length !== 1) return;
    const action = h.keys?.[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    if (typeof action === "string") location.assign(action); else action();
  });
}

/** Binds the on/off checkbox on the "?" sheet. announce receives a short status line (pass the toast). */
export function bindSingleKeysSwitch(input: HTMLInputElement, announce?: (msg: string) => void): void {
  input.checked = singleKeysOn();
  input.addEventListener("change", () => {
    setSingleKeys(input.checked);
    announce?.(input.checked ? "Single-key shortcuts on" : "Single-key shortcuts off");
  });
}
