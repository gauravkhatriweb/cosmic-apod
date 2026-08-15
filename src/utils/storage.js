/**
 * Utility: safe localStorage wrapper.
 *
 * localStorage can throw (private browsing, full quota, etc.).
 * These helpers ensure the app never crashes from storage issues.
 */

// In-memory fallback if localStorage is unavailable or full
const memoryFallback = new Map();

/**
 * Check if localStorage is available and working.
 */
function isStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasStorage = isStorageAvailable();

/**
 * Read and parse a JSON value from localStorage or memory fallback.
 * Returns `fallback` on any error.
 */
export function storageGet(key, fallback = null) {
  if (!hasStorage) {
    return memoryFallback.has(key) ? memoryFallback.get(key) : fallback;
  }
  
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    // If JSON.parse fails, return fallback
    return fallback;
  }
}

/**
 * Write a JSON-serialisable value to localStorage or memory fallback.
 */
export function storageSet(key, value) {
  if (!hasStorage) {
    memoryFallback.set(key, value);
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Quota exceeded or other error — fallback to memory
    memoryFallback.set(key, value);
    
    // If it's a quota error, we might try to clean up, but for now memory fallback is safe.
  }
}

/**
 * Remove a key from storage.
 */
export function storageRemove(key) {
  if (!hasStorage) {
    memoryFallback.delete(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore error
  }
}
