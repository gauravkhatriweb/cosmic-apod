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
 * Show a brief toast notification with auto-dismiss and manual dismiss.
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification">✕</button>
  `;
  
  container.appendChild(toast);

  let timeoutId;
  const dismiss = () => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
    clearTimeout(timeoutId);
  };
  
  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  timeoutId = setTimeout(dismiss, duration);
}
