/**
 * History manager.
 *
 * Records recently viewed APODs in localStorage.
 * Keeps a maximum of 30 entries.
 */

import { storageGet, storageSet } from '../utils/storage.js';

const STORAGE_KEY = 'cosmic_apod_history';
const MAX_ITEMS   = 30;

/**
 * Read full history list (newest first).
 */
export function getHistory() {
  return storageGet(STORAGE_KEY, []);
}

/**
 * Add an APOD to history. Deduplicates by date and caps the list.
 */
export function addToHistory(apod) {
  let history = getHistory();
  // Remove any existing entry for the same date
  history = history.filter((h) => h.date !== apod.date);
  // Prepend
  history.unshift({
    date:       apod.date,
    title:      apod.title,
    url:        apod.url,
    media_type: apod.media_type,
    thumbnail_url: apod.thumbnail_url || '',
  });
  // Cap
  if (history.length > MAX_ITEMS) history = history.slice(0, MAX_ITEMS);
  storageSet(STORAGE_KEY, history);
}

/**
 * Clear all history.
 */
export function clearHistory() {
  storageSet(STORAGE_KEY, []);
}
