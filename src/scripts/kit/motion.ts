// web-design-elements kit: motion.ts v1
// One place for the reduced-motion decision. An explicit behavior:'smooth' in script overrides the CSS
// scroll-behavior rule, so every script scroll goes through these helpers.

export const reducedMotion = (): boolean =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "smooth" without a reduced-motion preference, "instant" with one. */
export const scrollBehavior = (): ScrollBehavior => (reducedMotion() ? "instant" : "smooth");

/** element.scrollIntoView, smooth only when motion is welcome. Pass behavior "instant" to force a jump. */
export function scrollIntoViewSafe(el: Element | null | undefined, opts: ScrollIntoViewOptions = {}): void {
  el?.scrollIntoView({ ...opts, behavior: opts.behavior === "instant" ? "instant" : scrollBehavior() });
}

/** window.scrollTo or element.scrollTo, smooth only when motion is welcome. */
export function scrollToSafe(target: Window | Element, opts: ScrollToOptions): void {
  target.scrollTo({ ...opts, behavior: opts.behavior === "instant" ? "instant" : scrollBehavior() });
}
