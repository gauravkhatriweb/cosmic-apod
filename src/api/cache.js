/**
 * API response cache.
 *
 * Uses safe storage to cache fetched APODs and prevent unnecessary network requests.
 * Caches items up to a reasonable limit.
 */

import { idbGet, idbSet, idbClear } from '../utils/idb.js';

/**
 * Retrieve cached APOD data for a given date from IndexedDB.
 */
export async function getCachedApod(date) {
  return await idbGet(date);
}

/**
 * Cache an APOD response.
 */
export async function setCachedApod(date, data) {
  await idbSet(date, data);
}

/**
 * Clear the APOD cache entirely.
 */
export async function clearCache() {
  await idbClear();
}
