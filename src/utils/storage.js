/**
 * Utility: safe localStorage wrapper.
 *
 * localStorage can throw (private browsing, full quota, etc.).
 * These helpers ensure the app never crashes from storage issues.
 */

/**
 * Read and parse a JSON value from localStorage.
 * Returns `fallback` on any error.
 */
export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a JSON-serialisable value to localStorage.
 */
export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — silent fail
  }
}
