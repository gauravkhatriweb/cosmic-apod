/**
 * Side panel renderer — used for Favorites and History panels.
 *
 * Accessible slide-out panel: focus trapping, Escape close, backdrop close.
 */

import { $, show, hide, escapeHtml } from '../utils/dom.js';
import { formatDate } from '../utils/dates.js';
import { getFavorites, removeFavorite } from './favorites.js';
import { getHistory } from './history.js';

let previousFocus = null;
let onItemClick = null;

/**
 * Open the side panel.
 * @param {'favorites'|'history'} mode
 * @param {function} onSelect — called with a date string when an item is clicked
 */
export function openPanel(mode, onSelect) {
  const panel   = $('#side-panel');
  const title   = $('#panel-title');
  const body    = $('#panel-body');
  if (!panel || !title || !body) return;

  onItemClick = onSelect;
  previousFocus = document.activeElement;

  title.textContent = mode === 'favorites' ? '★ Favorites' : '⏱ History';
  renderPanelItems(body, mode);

  show(panel);
  document.body.style.overflow = 'hidden';

  // Focus the close button
  setTimeout(() => $('#panel-close')?.focus(), 50);
}

/**
 * Close the side panel.
 */
export function closePanel() {
  const panel = $('#side-panel');
  if (!panel) return;

  hide(panel);
  document.body.style.overflow = '';
  onItemClick = null;

  if (previousFocus) {
    previousFocus.focus();
    previousFocus = null;
  }
}

/**
 * Render the panel item list.
 */
function renderPanelItems(body, mode) {
  const items = mode === 'favorites' ? getFavorites() : getHistory();

  if (items.length === 0) {
    const icon = mode === 'favorites' ? '★' : '⏱';
    const label = mode === 'favorites'
      ? 'No favorites yet. Heart an APOD to save it here.'
      : 'No history yet. Browse some APODs to build your timeline.';
    body.innerHTML = `
      <div class="panel-empty">
        <span class="panel-empty-icon" aria-hidden="true">${icon}</span>
        <p>${escapeHtml(label)}</p>
      </div>`;
    return;
  }

  body.innerHTML = '';

  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'panel-item';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `View ${escapeHtml(item.title)}`);

    // Thumbnail
    const thumbSrc =
      item.media_type === 'video'
        ? item.thumbnail_url || ''
        : item.url || '';

    const thumbHtml = thumbSrc
      ? `<img class="panel-item-thumb" src="${escapeHtml(thumbSrc)}" alt="" loading="lazy" />`
      : `<div class="panel-item-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:1.2rem" aria-hidden="true">✦</div>`;

    const removeHtml = mode === 'favorites'
      ? `<button type="button" class="panel-item-remove" data-remove="${escapeHtml(item.date)}" aria-label="Remove ${escapeHtml(item.title)} from favorites">✕</button>`
      : '';

    el.innerHTML = `
      ${thumbHtml}
      <div class="panel-item-info">
        <div class="panel-item-title">${escapeHtml(item.title)}</div>
        <div class="panel-item-date">${formatDate(item.date)}</div>
      </div>
      ${removeHtml}`;

    // Click/Enter to navigate
    const navigate = () => {
      if (onItemClick) onItemClick(item.date);
      closePanel();
    };
    el.addEventListener('click', (e) => {
      // Don't navigate if the remove button was clicked
      if (e.target.closest('.panel-item-remove')) return;
      navigate();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate();
      }
    });

    // Remove button
    if (mode === 'favorites') {
      const removeBtn = el.querySelector('.panel-item-remove');
      removeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(item.date);
        renderPanelItems(body, mode);
      });
    }

    body.appendChild(el);
  }
}

/**
 * Bind panel event listeners.
 */
export function initPanel() {
  const closeBtn  = $('#panel-close');
  const backdrop  = $('#panel-backdrop');
  const panel     = $('#side-panel');

  closeBtn?.addEventListener('click', closePanel);
  backdrop?.addEventListener('click', closePanel);

  panel?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
    }
  });
}
