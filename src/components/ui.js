import { escapeHtml } from '../utils/dom.js';

/**
 * Generates HTML for a grid card representing an APOD.
 * @param {Object} apod 
 * @returns {string} HTML string
 */
export function createApodCard(apod) {
  if (!apod) return '';
  
  const thumb = apod.media_type === 'video' ? apod.thumbnail_url : apod.url;
  const safeTitle = escapeHtml(apod.title);
  const safeDate = escapeHtml(apod.date);
  
  // Use a placeholder if thumb is missing or loading
  const bgStyle = thumb ? `background-image: url('${escapeHtml(thumb)}');` : 'background-color: var(--bg-surface);';
  
  return `
    <article class="apod-card" data-date="${safeDate}" tabindex="0" role="button" aria-label="View APOD for ${safeDate}">
      <div class="apod-card-thumb" style="${bgStyle}"></div>
      <div class="apod-card-info">
        <h3 class="apod-card-title">${safeTitle}</h3>
        <time class="apod-card-date">${safeDate}</time>
      </div>
    </article>
  `;
}

/**
 * Renders skeleton loader cards.
 */
export function createSkeletonCards(count = 6) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="apod-card skeleton">
        <div class="apod-card-thumb skeleton-pulse"></div>
        <div class="apod-card-info">
          <div class="skeleton-text skeleton-pulse" style="width: 80%; height: 1.2rem; margin-bottom: 0.5rem;"></div>
          <div class="skeleton-text skeleton-pulse" style="width: 50%; height: 0.9rem;"></div>
        </div>
      </div>
    `;
  }
  return html;
}
