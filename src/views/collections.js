import { getCollections, createCollection, deleteCollection, renameCollection, serializeCollectionForUrl } from '../components/collections.js';
import { getCachedApod } from '../api/cache.js';
import { createApodCard, createSkeletonCards } from '../components/ui.js';
import { setView } from '../state/store.js';
import { setUrlDate } from '../components/share.js';
import { escapeHtml, showToast } from '../utils/dom.js';

export async function renderCollections() {
  const container = document.getElementById('view-collections');
  if (!container) return;

  const cols = getCollections();
  const colKeys = Object.keys(cols);

  let html = `
    <div class="explorer-header">
      <h2>My Collections</h2>
      <p>Organize your favorite astronomical discoveries into custom curations.</p>
      <div class="explorer-actions">
        <button class="btn btn-primary" id="btn-create-col">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Collection
        </button>
      </div>
    </div>
  `;

  if (colKeys.length === 0) {
    html += `
      <div class="panel-empty" style="text-align:center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-color); max-width: 600px; margin: 0 auto;">
        <span class="panel-empty-icon" style="font-size:3rem; display:block; margin-bottom:1rem; opacity: 0.8;">🌌</span>
        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; font-family: var(--font-display);">No Collections Yet</h3>
        <p>Create your first collection to group and share your favorite cosmos photos.</p>
      </div>
    `;
    container.innerHTML = html;
  } else {
    html += `<div class="collections-list" style="display: flex; flex-direction: column; gap: var(--space-2xl);">`;
    
    // We will render skeletons first, then populate asynchronously
    for (const key of colKeys) {
      const col = cols[key];
      html += `
        <div class="collection-section" data-id="${escapeHtml(key)}">
          <h3 class="section-title">
            <span>${escapeHtml(col.name)} <span style="color:var(--text-muted); font-size:0.9rem; font-weight:normal; margin-left: 0.5rem;">(${col.items.length} items)</span></span>
            <div style="display:flex; gap: var(--space-xs);">
              <button class="btn btn-secondary btn-sm btn-rename-col" data-id="${escapeHtml(key)}" aria-label="Rename">✏️</button>
              <button class="btn btn-secondary btn-sm btn-share-col" data-id="${escapeHtml(key)}" aria-label="Share">🔗</button>
              <button class="btn btn-secondary btn-sm btn-delete-col" data-id="${escapeHtml(key)}" aria-label="Delete">🗑️</button>
            </div>
          </h3>
          <div class="card-grid col-grid-${escapeHtml(key)}" style="margin-top: var(--space-md);">
            ${col.items.length > 0 ? createSkeletonCards(Math.min(col.items.length, 4)) : '<p style="color:var(--text-muted); grid-column:1/-1;">Empty collection. Add APODs from the Explorer or Dashboard.</p>'}
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Load APOD cards asynchronously for each collection
    for (const key of colKeys) {
      const col = cols[key];
      if (col.items.length > 0) {
        populateCollectionGrid(key, col.items);
      }
    }
  }

  bindCollectionEvents(container);
}

async function populateCollectionGrid(id, dateIds) {
  const grid = document.querySelector(`.col-grid-${id}`);
  if (!grid) return;
  
  const apods = [];
  for (const date of dateIds) {
    const apod = await getCachedApod(date);
    if (apod) apods.push(apod);
  }
  
  if (apods.length > 0) {
    grid.innerHTML = apods.map(createApodCard).join('');
  } else {
    grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">Items could not be loaded. They might not be cached offline.</p>';
  }
}

let isCollectionsBound = false;

function bindCollectionEvents(container) {
  if (isCollectionsBound) return;
  
  container.addEventListener('click', (e) => {
    // Create Collection
    if (e.target.closest('#btn-create-col')) {
      const name = prompt('Enter a name for your new collection:');
      if (name && name.trim()) {
        createCollection(name);
        renderCollections();
      }
      return;
    }
    // Share Collection
    if (e.target.closest('.btn-share-col')) {
      const id = e.target.closest('.btn-share-col').dataset.id;
      const b64 = serializeCollectionForUrl(id);
      if (!b64) return;
      
      // Ensure we don't exceed URL limits. Base64 can get large if > 200 items, but dates are small.
      const url = new URL(window.location.origin);
      url.searchParams.set('collection', b64);
      
      navigator.clipboard.writeText(url.toString())
        .then(() => showToast('Collection share link copied to clipboard!'))
        .catch(() => prompt('Copy this link to share:', url.toString()));
      return;
    }
    
    // Rename Collection
    if (e.target.closest('.btn-rename-col')) {
      const id = e.target.closest('.btn-rename-col').dataset.id;
      const cols = getCollections();
      const currentName = cols[id]?.name || '';
      const newName = prompt('Enter a new name for this collection:', currentName);
      if (newName && newName.trim() && newName !== currentName) {
        renameCollection(id, newName);
        renderCollections();
      }
      return;
    }
    
    // Delete Collection
    if (e.target.closest('.btn-delete-col')) {
      const id = e.target.closest('.btn-delete-col').dataset.id;
      if (confirm('Are you sure you want to delete this collection?')) {
        deleteCollection(id);
        renderCollections();
      }
      return;
    }
    
    // View APOD
    const card = e.target.closest('.apod-card');
    if (card) {
      const date = card.dataset.date;
      if (date) {
        setView('apod');
        setUrlDate(date);
        window.dispatchEvent(new CustomEvent('load-apod', { detail: { date } }));
      }
    }
  });
  
  isCollectionsBound = true;
}
