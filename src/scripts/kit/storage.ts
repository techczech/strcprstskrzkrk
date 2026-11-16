// web-design-elements kit: storage.ts v2
// Preferences in localStorage as an optional enhancement. Every access is wrapped: storage throws in sandboxed
// viewers, private modes and with site data blocked, and the page must keep working without it.
// v2: a value written while storage is unavailable is kept in memory for the rest of the page's life, so a
// setting that rereads its preference (the single-key switch, a voice choice) still takes effect.

const memory = new Map<string, string | null>();

export function readPref(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

/** Stores a value, or removes the key when value is null. Returns false when storage is unavailable (the value still holds for this page). */
export function writePref(key: string, value: string | null): boolean {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    memory.delete(key);
    return true;
  } catch {
    memory.set(key, value);
    return false;
  }
}
