/**
 * Utility: date helpers.
 */

import { APOD_START_DATE } from '../api/nasa.js';

/**
 * Format a Date object as YYYY-MM-DD in local time.
 */
export function toDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Today's date string in local time.
 */
export function todayString() {
  return toDateString(new Date());
}

/**
 * Shift a YYYY-MM-DD date by `days` (positive = forward, negative = back).
 */
export function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00'); // noon avoids DST edge cases
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/**
 * Clamp a date string between APOD_START_DATE and today.
 */
export function clampDate(dateStr) {
  const today = todayString();
  if (dateStr < APOD_START_DATE) return APOD_START_DATE;
  if (dateStr > today) return today;
  return dateStr;
}

/**
 * Is the given date string at the lower APOD boundary?
 */
export function isMinDate(dateStr) {
  return dateStr <= APOD_START_DATE;
}

/**
 * Is the given date string today (or in the future)?
 */
export function isMaxDate(dateStr) {
  return dateStr >= todayString();
}

/**
 * Generate a random date between APOD_START_DATE and today.
 */
export function randomDateString() {
  const start = new Date(APOD_START_DATE + 'T12:00:00').getTime();
  const end   = new Date(todayString() + 'T12:00:00').getTime();
  const rand  = start + Math.random() * (end - start);
  return toDateString(new Date(rand));
}

/**
 * Format YYYY-MM-DD into a human-readable string.
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
