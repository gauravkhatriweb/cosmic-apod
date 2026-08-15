/**
 * API response cache.
 *
 * Uses safe storage to cache fetched APODs and prevent unnecessary network requests.
 * Caches items up to a reasonable limit.
 */

import { storageGet, storageSet } from '../utils/storage.js';

const CACHE_KEY = 'cosmic_apod_cache';
const MAX_CACHE_ITEMS = 60; // Keep up to ~2 months of recently viewed items

/**
 * Retrieve cached APOD data for a given date.
 */
export function getCachedApod(date) {
  const cache = storageGet(CACHE_KEY, {});
  return cache[date] || null;
}

/**
 * Cache an APOD response.
 */
export function setCachedApod(date, data) {
  const cache = storageGet(CACHE_KEY, {});
  
  cache[date] = data;
  
  // Enforce size limit using an LRU-like approach (remove oldest based on object keys)
  const keys = Object.keys(cache);
  if (keys.length > MAX_CACHE_ITEMS) {
    // Remove a batch of old entries
    const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_ITEMS);
    for (const k of keysToRemove) {
      delete cache[k];
    }
  }
  
  storageSet(CACHE_KEY, cache);
}

/**
 * Clear the APOD cache entirely.
 */
export function clearCache() {
  storageSet(CACHE_KEY, {});
}
