// web-design-elements kit: theme.ts v1
// Three-way theme: system (default), light, dark. Websites follow the system setting unless the reader picks
// otherwise; with no stored choice and no system signal the light tokens on :root apply (never dark). Same rule as the desktop apps.
//
// 1. Put themePrepaint() in an inline <script> in <head>, before any stylesheet paints (Astro:
//    <script is:inline set:html={themePrepaint()} />). It adds html.js, applies a stored choice as
//    html[data-theme], and wires every [data-theme-set="system|light|dark"] button with aria-pressed.
// 2. CSS: light tokens on :root; dark tokens on :root[data-theme="dark"] and inside
//    @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }; plus color-scheme (see theme-and-tokens.md).
// 3. With JavaScript off nothing runs and prefers-color-scheme decides; hide the switch with .js-only.

/** The pre-paint script as a string, for an inline <script>. Storage is optional and always guarded. */
export function themePrepaint(storageKey = "theme"): string {
  const k = JSON.stringify(storageKey);
  return `(function(){var d=document.documentElement;d.classList.add('js');
function set(t){if(t==='light'||t==='dark')d.setAttribute('data-theme',t);else d.removeAttribute('data-theme');
document.querySelectorAll('[data-theme-set]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-theme-set')===(t==='light'||t==='dark'?t:'system')))})}
var t=null;try{t=localStorage.getItem(${k})}catch(e){}
set(t);d.classList.add('theme-ready');
document.addEventListener('DOMContentLoaded',function(){set(t);document.querySelectorAll('[data-theme-set]').forEach(function(b){b.addEventListener('click',function(){
t=b.getAttribute('data-theme-set');try{if(t==='system')localStorage.removeItem(${k});else localStorage.setItem(${k},t)}catch(e){}set(t)})})})})();`;
}

/** Presses the next theme button (system, light, dark), so the theme logic stays in the pre-paint script. Returns the new choice. */
export function cycleTheme(): string | null {
  const btns = Array.from(document.querySelectorAll<HTMLElement>("[data-theme-set]"));
  if (!btns.length) return null;
  const cur = btns.findIndex((b) => b.getAttribute("aria-pressed") === "true");
  const next = btns[(cur + 1) % btns.length];
  next.click();
  return next.dataset.themeSet ?? null;
}
