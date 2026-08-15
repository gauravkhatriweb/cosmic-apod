/**
 * Lightbox (fullscreen media viewer).
 *
 * Accessible modal: traps focus, closes on Escape / backdrop click.
 */

import { $, show, hide } from '../utils/dom.js';
import { escapeHtml } from '../utils/dom.js';

let previousFocus = null;

/**
 * Open the lightbox with the given APOD data.
 */
export function openLightbox(apod) {
  const lightbox = $('#lightbox');
  const content  = $('#lightbox-content');
  if (!lightbox || !content) return;

  previousFocus = document.activeElement;
  content.innerHTML = '';

  if (apod.media_type === 'video') {
    const iframe = document.createElement('iframe');
    iframe.src = apod.url;
    iframe.setAttribute('allowfullscreen', '');
    iframe.title = escapeHtml(apod.title);
    content.appendChild(iframe);
  } else {
    const img = document.createElement('img');
    img.src = apod.hdurl || apod.url;
    img.alt = escapeHtml(apod.title);
    img.loading = 'eager';
    content.appendChild(img);
  }

  show(lightbox);
  document.body.style.overflow = 'hidden';

  // Focus the close button
  setTimeout(() => $('#lightbox-close')?.focus(), 50);
}

/**
 * Close the lightbox.
 */
export function closeLightbox() {
  const lightbox = $('#lightbox');
  if (!lightbox) return;

  hide(lightbox);
  document.body.style.overflow = '';

  if (previousFocus) {
    previousFocus.focus();
    previousFocus = null;
  }
}

/**
 * Bind lightbox event listeners.
 */
export function initLightbox() {
  const lightbox = $('#lightbox');
  const closeBtn = $('#lightbox-close');
  const backdrop = $('#lightbox-backdrop');

  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);

  lightbox?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    }
    // Trap focus inside the lightbox
    if (e.key === 'Tab') {
      // Only one focusable element (close button), so trap
      e.preventDefault();
      closeBtn?.focus();
    }
  });
}
