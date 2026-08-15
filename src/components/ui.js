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
  
  // Tags
  const tagsHtml = apod.tags && apod.tags.length > 0 
    ? `<div class="apod-tags-wrap">${apod.tags.map(t => `<span class="apod-tag">${escapeHtml(t)}</span>`).join('')}</div>` 
    : '';
  
  // Use a placeholder if thumb is missing or loading
  const bgStyle = thumb ? `background-image: url('${escapeHtml(thumb)}');` : 'background-color: var(--bg-surface);';
  
  return `
    <article class="apod-card" data-date="${safeDate}" tabindex="0" role="button" aria-label="View APOD for ${safeDate}">
      <div class="apod-card-thumb" style="${bgStyle}"></div>
      <div class="apod-card-info">
        <h3 class="apod-card-title">${safeTitle}</h3>
        <time class="apod-card-date">${safeDate}</time>
        ${tagsHtml}
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

/**
 * Generates HTML for the Dashboard Hero (Today's APOD)
 */
export function createDashboardHero(apod) {
  if (!apod) return '';
  
  const thumb = apod.media_type === 'video' ? apod.thumbnail_url : apod.url;
  const safeTitle = escapeHtml(apod.title);
  const safeDate = escapeHtml(apod.date);
  const shortExp = escapeHtml(apod.explanation).substring(0, 150) + '...';
  
  const bgStyle = thumb ? `background-image: url('${escapeHtml(thumb)}');` : 'background-color: var(--bg-surface);';
  
  return `
    <article class="dash-hero" data-date="${safeDate}">
      <div class="dash-hero-media" style="${bgStyle}"></div>
      <div class="dash-hero-content">
        <span class="meta-badge">Today's Feature</span>
        <h3 class="dash-hero-title">${safeTitle}</h3>
        <time class="meta-date">${safeDate}</time>
        <p class="dash-hero-exp">${shortExp}</p>
        <div class="dash-hero-actions">
          <button class="btn btn-primary btn-explore-hero">Explore</button>
          <button class="btn btn-secondary btn-fav-hero" aria-label="Favorite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="btn btn-secondary btn-share-hero" aria-label="Share">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}
