/**
 * Utility: DOM helpers.
 */

/**
 * Shorthand querySelector.
 */
export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Safely set text content.
 */
export function setText(el, text) {
  if (el) el.textContent = text || '';
}

/**
 * Show an element by removing the `hidden` attribute.
 */
export function show(el) {
  if (el) el.removeAttribute('hidden');
}

/**
 * Hide an element by setting the `hidden` attribute.
 */
export function hide(el) {
  if (el) el.setAttribute('hidden', '');
}

/**
 * Escape HTML entities to prevent injection when inserting API text.
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Show a brief toast notification.
 */
export function showToast(message) {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Remove after animation completes
  setTimeout(() => toast.remove(), 3000);
}
