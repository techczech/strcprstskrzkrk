// web-design-elements kit: storage.ts v1
// Preferences in localStorage as an optional enhancement. Every access is wrapped: storage throws in sandboxed
// viewers, private modes and with site data blocked, and the page must keep working without it.

export function readPref(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

/** Stores a value, or removes the key when value is null. Returns false when storage is unavailable. */
export function writePref(key: string, value: string | null): boolean {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch { return false; }
}
