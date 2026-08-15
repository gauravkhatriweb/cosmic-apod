/**
 * Share utility.
 *
 * Uses Web Share API when available, falls back to clipboard copy.
 */

import { showToast } from '../utils/dom.js';

/**
 * Share the given APOD.
 */
export async function shareApod(apod) {
  const shareUrl = buildShareUrl(apod.date);
  const shareData = {
    title: `${apod.title} — Cosmic APOD`,
    text:  `Check out NASA's Astronomy Picture of the Day: ${apod.title}`,
    url:   shareUrl,
  };

  // Try Web Share API first
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // User cancelled — that's fine, don't show an error
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard ✓');
  } catch {
    // Final fallback: prompt
    showToast('Could not copy — check your browser permissions.');
  }
}

/**
 * Build a share URL that includes the date as a query parameter.
 */
function buildShareUrl(date) {
  const url = new URL(window.location.href);
  url.searchParams.set('date', date);
  // Remove hash
  url.hash = '';
  return url.toString();
}

/**
 * Read a date from the current URL query string.
 */
export function getDateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('date') || null;
}

/**
 * Update the URL query string with the current date without reloading.
 */
export function setUrlDate(dateOrView) {
  const url = new URL(window.location);
  url.searchParams.set('date', dateOrView);
  
  const view = (dateOrView === 'dashboard' || dateOrView === 'explorer') ? dateOrView : 'apod';
  
  // Use replaceState initially if no query param exists to avoid empty history
  if (!window.history.state) {
    window.history.replaceState({ view, date: view === 'apod' ? dateOrView : null }, '', url);
  } else {
    window.history.pushState({ view, date: view === 'apod' ? dateOrView : null }, '', url);
  }
}
