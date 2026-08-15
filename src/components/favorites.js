/**
 * Favorites manager.
 *
 * Persists favorite APODs in localStorage as an array of
 * { date, title, url, media_type } objects, keyed by date.
 */

import { storageGet, storageSet } from '../utils/storage.js';

const STORAGE_KEY = 'cosmic_apod_favorites';

/**
 * Read the full favorites list.
 */
export function getFavorites() {
  const data = storageGet(STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

/**
 * Check whether a date is favorited.
 */
export function isFavorited(date) {
  return getFavorites().some((f) => f.date === date);
}

/**
 * Toggle favorite for an APOD entry. Returns new favorited state.
 */
export function toggleFavorite(apod) {
  const favs = getFavorites();
  const idx = favs.findIndex((f) => f.date === apod.date);
  if (idx !== -1) {
    favs.splice(idx, 1);
    storageSet(STORAGE_KEY, favs);
    return false;
  }
  // Store a lightweight record
  favs.unshift({
    date:       apod.date,
    title:      apod.title,
    url:        apod.url,
    media_type: apod.media_type,
    thumbnail_url: apod.thumbnail_url || '',
  });
  storageSet(STORAGE_KEY, favs);
  return true;
}

/**
 * Remove a single favorite by date.
 */
export function removeFavorite(date) {
  const favs = getFavorites().filter((f) => f.date !== date);
  storageSet(STORAGE_KEY, favs);
}
