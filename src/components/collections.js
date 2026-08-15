/**
 * Shareable Collections Manager
 *
 * Handles creation, modification, deletion, and parsing of APOD collections.
 */

import { storageGet, storageSet } from '../utils/storage.js';

const COLLECTIONS_KEY = 'cosmic_apod_collections';

/**
 * Get all collections.
 * Format: { [id]: { name: string, items: string[] } }
 */
export function getCollections() {
  return storageGet(COLLECTIONS_KEY, {});
}

function saveCollections(cols) {
  storageSet(COLLECTIONS_KEY, cols);
}

/**
 * Generate a URL-safe unique ID.
 */
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Create a new collection.
 */
export function createCollection(name) {
  const cols = getCollections();
  const id = generateId();
  cols[id] = { name: name.trim(), items: [] };
  saveCollections(cols);
  return id;
}

/**
 * Delete a collection.
 */
export function deleteCollection(id) {
  const cols = getCollections();
  if (cols[id]) {
    delete cols[id];
    saveCollections(cols);
  }
}

/**
 * Rename a collection.
 */
export function renameCollection(id, newName) {
  const cols = getCollections();
  if (cols[id]) {
    cols[id].name = newName.trim();
    saveCollections(cols);
  }
}

/**
 * Add an APOD date to a collection.
 */
export function addToCollection(id, date) {
  const cols = getCollections();
  if (cols[id] && !cols[id].items.includes(date)) {
    cols[id].items.unshift(date); // add to top
    saveCollections(cols);
  }
}

/**
 * Remove an APOD date from a collection.
 */
export function removeFromCollection(id, date) {
  const cols = getCollections();
  if (cols[id]) {
    cols[id].items = cols[id].items.filter(d => d !== date);
    saveCollections(cols);
  }
}

/**
 * Check if a date is in a specific collection.
 */
export function isInCollection(id, date) {
  const cols = getCollections();
  return cols[id]?.items.includes(date) || false;
}

/**
 * Get all collections that contain a specific date.
 */
export function getCollectionsContaining(date) {
  const cols = getCollections();
  return Object.entries(cols)
    .filter(([_, col]) => col.items.includes(date))
    .map(([id, col]) => ({ id, name: col.name }));
}

/**
 * Serialize a collection to a base64 URL parameter.
 * We compress it by just joining dates with commas to save space, then btoa.
 * e.g., "Name|2023-01-01,2023-01-02"
 */
export function serializeCollectionForUrl(id) {
  const cols = getCollections();
  const col = cols[id];
  if (!col) return null;
  
  const raw = `${col.name}|${col.items.join(',')}`;
  return btoa(raw); // URL-safe base64
}

/**
 * Deserialize a collection from a base64 string.
 * Returns { name, items } or null.
 */
export function deserializeCollectionFromUrl(base64Str) {
  try {
    const raw = atob(base64Str);
    const [name, itemsStr] = raw.split('|');
    const items = itemsStr ? itemsStr.split(',') : [];
    return { name, items };
  } catch (e) {
    return null;
  }
}

/**
 * Import a shared collection into the user's local store.
 */
export function importCollection(name, items) {
  const cols = getCollections();
  const id = generateId();
  cols[id] = { name: name.trim() + ' (Imported)', items };
  saveCollections(cols);
  return id;
}
