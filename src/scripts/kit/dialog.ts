// web-design-elements kit: dialog.ts v1
// Modal dialogs on native <dialog>.showModal(). The browser supplies focus containment, Esc, the inert page,
// the top layer and focus return. This module adds only: an initial focus target, close on a backdrop click,
// [data-close] buttons, an onClose callback, closing the topmost dialog, and the "is a dialog open" check
// that single-key shortcuts need. No role="dialog", aria-modal, focus trap, Esc handler or body scroll lock.
// Style every dialog with dialog.css; never ship the browser's default box.

export type OpenOptions = { focus?: string; onClose?: () => void };

const stack: HTMLDialogElement[] = [];

export const isOpen = (d: Element | null | undefined): boolean => d instanceof HTMLDialogElement && d.open;
export const anyOpen = (): boolean => !!document.querySelector("dialog[open]");

export function openDialog(d: HTMLDialogElement | null | undefined, opts: OpenOptions = {}): void {
  if (!d || d.open) return;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  d.showModal();
  stack.push(d);
  if (opts.focus) d.querySelector<HTMLElement>(opts.focus)?.focus();
  d.addEventListener("close", () => {
    const i = stack.lastIndexOf(d);
    if (i > -1) stack.splice(i, 1);
    // Focus can stay on a control inside the closed dialog (a search input), which would make single keys think the reader
    // is still typing. Blur it, then return focus to the opener when there was one.
    if (d.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    if (opener && opener !== document.body && opener.isConnected && (document.activeElement === document.body || !document.activeElement)) opener.focus();
    opts.onClose?.();
  }, { once: true });
}

/** Closes the given dialog, or the topmost one this module opened. */
export function closeDialog(d?: HTMLDialogElement | null): void {
  const target = d ?? stack[stack.length - 1];
  if (target?.open) target.close();
}

/** Wires backdrop clicks and [data-close] buttons for every dialog matching the selector. Call once per page. */
export function initDialogs(selector = "dialog.kit-dlg"): void {
  for (const d of Array.from(document.querySelectorAll<HTMLDialogElement>(selector))) {
    let downOutside = false;
    const outside = (e: MouseEvent) => {
      if (e.target !== d) return false;
      const r = d.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    // Close only when the press and the release are both on the backdrop, so a text selection dragged out of the dialog does not close it.
    d.addEventListener("pointerdown", (e) => { downOutside = outside(e); });
    d.addEventListener("click", (e) => {
      if (downOutside && outside(e)) { downOutside = false; d.close(); return; }
      downOutside = false;
      if ((e.target as Element).closest("[data-close]")) d.close();
    });
  }
}
