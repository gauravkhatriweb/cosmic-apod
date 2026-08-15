import { fetchMultipleApods } from '../api/nasa.js';
import { createApodCard, createSkeletonCards } from '../components/ui.js';
import { setView } from '../state/store.js';
import { setUrlDate } from '../components/share.js';
import { todayString, shiftDate } from '../utils/dates.js';

let currentApods = []; // Store currently loaded APODs for client-side filtering
let isExplorerBound = false;

export async function renderExplorer() {
  const container = document.getElementById('view-explorer');
  if (!container) return;

  container.innerHTML = `
    <div class="explorer-header">
      <h2>Cosmic Archive</h2>
      <p>Browse random discoveries from the past three decades.</p>
      
      <div class="explorer-actions" style="margin-bottom: 1.5rem; flex-wrap: wrap;">
        <button class="btn btn-primary" id="btn-explore-random">Shuffle Random</button>
        <button class="btn btn-secondary" id="btn-explore-recent">Last 7 Days</button>
        <button class="btn btn-secondary" id="btn-explore-month">Last 30 Days</button>
        <button class="btn btn-secondary" id="btn-explore-year">This Year</button>
      </div>

      <div class="filter-bar" style="display: flex; gap: 1rem; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <label style="color: var(--text-muted); font-size: 0.9rem;">From</label>
          <input type="date" id="filter-start-date" class="date-picker" />
          <label style="color: var(--text-muted); font-size: 0.9rem;">To</label>
          <input type="date" id="filter-end-date" class="date-picker" />
          <button class="btn btn-primary btn-sm" id="btn-apply-date-range">Go</button>
        </div>
      </div>

      <div class="filter-bar" style="display: flex; gap: 1rem; align-items: center; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem; background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <input type="text" id="filter-search" class="date-picker" placeholder="Search loaded archive..." aria-label="Search APODs" style="flex: 1; min-width: 200px;" />
        
        <select id="filter-tag" class="date-picker" aria-label="Filter by Tag">
          <option value="">All Tags</option>
          <option value="Galaxy">Galaxy</option>
          <option value="Nebula">Nebula</option>
          <option value="Planet">Planet</option>
          <option value="Star">Star</option>
          <option value="Moon">Moon</option>
          <option value="Black Hole">Black Hole</option>
          <option value="Deep Space">Deep Space</option>
          <option value="Night Sky">Night Sky</option>
        </select>
        
        <select id="filter-media" class="date-picker" aria-label="Filter by Media Type">
          <option value="">All Media</option>
          <option value="image">Image Only</option>
          <option value="video">Video Only</option>
        </select>
        
        <select id="filter-sort" class="date-picker" aria-label="Sort Order">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="random">Random</option>
        </select>
        
        <button class="btn btn-secondary" id="btn-layout-toggle" aria-label="Toggle Layout">
          <span id="layout-icon">☷</span>
        </button>
      </div>
    </div>
    
    <div class="card-grid" id="grid-explorer">
      ${createSkeletonCards(12)}
    </div>
  `;

  if (!isExplorerBound) {
    bindGridClicks(container);
    
    window.addEventListener('filter-explorer', (e) => {
      const tag = e.detail?.tag;
      if (tag) {
        const tagSelect = document.getElementById('filter-tag');
        if (tagSelect) {
          tagSelect.value = tag;
          applyFilters();
        }
      }
    });

    isExplorerBound = true;
  }

  // Bind Buttons
  const btnRandom = document.getElementById('btn-explore-random');
  const btnRecent = document.getElementById('btn-explore-recent');
  const btnMonth = document.getElementById('btn-explore-month');
  const btnYear = document.getElementById('btn-explore-year');
  const filterSearch = document.getElementById('filter-search');
  const filterTag = document.getElementById('filter-tag');
  const filterMedia = document.getElementById('filter-media');
  const filterSort = document.getElementById('filter-sort');
  const btnLayout = document.getElementById('btn-layout-toggle');
  const startDateInput = document.getElementById('filter-start-date');
  const endDateInput = document.getElementById('filter-end-date');
  const btnApplyRange = document.getElementById('btn-apply-date-range');
  
  btnRandom.addEventListener('click', () => loadExplorerData({ count: 20 }));
  
  btnRecent.addEventListener('click', () => {
    const today = todayString();
    const past = shiftDate(today, -6);
    startDateInput.value = past;
    endDateInput.value = today;
    loadExplorerData({ start_date: past, end_date: today });
  });

  btnMonth.addEventListener('click', () => {
    const today = todayString();
    const past = shiftDate(today, -29);
    startDateInput.value = past;
    endDateInput.value = today;
    loadExplorerData({ start_date: past, end_date: today });
  });

  btnYear.addEventListener('click', () => {
    const today = todayString();
    const yearStart = `${today.split('-')[0]}-01-01`;
    startDateInput.value = yearStart;
    endDateInput.value = today;
    loadExplorerData({ start_date: yearStart, end_date: today });
  });

  btnApplyRange.addEventListener('click', () => {
    const start = startDateInput.value;
    const end = endDateInput.value;
    if (start && end) {
      if (new Date(start) > new Date(end)) {
        alert("Start date cannot be after end date.");
        return;
      }
      loadExplorerData({ start_date: start, end_date: end });
    }
  });

  filterSearch.addEventListener('input', () => applyFilters());
  filterTag.addEventListener('change', applyFilters);
  filterMedia.addEventListener('change', applyFilters);
  filterSort.addEventListener('change', applyFilters);

  btnLayout.addEventListener('click', () => {
    const grid = document.getElementById('grid-explorer');
    const icon = document.getElementById('layout-icon');
    if (grid.style.gridTemplateColumns === '1fr') {
      grid.style.gridTemplateColumns = '';
      icon.textContent = '☷'; // Grid
    } else {
      grid.style.gridTemplateColumns = '1fr';
      icon.textContent = '☰'; // List
    }
  });

  // Default load
  loadExplorerData({ count: 12 });
}

function applyFilters() {
  const grid = document.getElementById('grid-explorer');
  if (!grid) return;
  
  const searchVal = document.getElementById('filter-search').value.toLowerCase();
  const tagVal = document.getElementById('filter-tag').value;
  const mediaVal = document.getElementById('filter-media').value;
  const sortVal = document.getElementById('filter-sort').value;
  
  let filtered = [...currentApods];
  
  if (searchVal) {
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(searchVal) || 
      (a.explanation && a.explanation.toLowerCase().includes(searchVal))
    );
  }
  
  if (mediaVal) {
    filtered = filtered.filter(a => a.media_type === mediaVal);
  }
  
  if (tagVal) {
    filtered = filtered.filter(a => a.tags && a.tags.includes(tagVal));
  }
  
  if (sortVal === 'newest') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortVal === 'oldest') {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortVal === 'random') {
    filtered.sort(() => Math.random() - 0.5);
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No APODs match these filters.</p>';
  } else {
    grid.innerHTML = filtered.map(createApodCard).join('');
  }
}

async function loadExplorerData(params) {
  const grid = document.getElementById('grid-explorer');
  if (!grid) return;
  
  grid.innerHTML = createSkeletonCards(params.count || 20);
  
  try {
    const apods = await fetchMultipleApods(params);
    if (params.start_date) {
      apods.reverse();
    }
    currentApods = apods;
    
    // reset filters
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-tag').value = '';
    document.getElementById('filter-media').value = '';
    document.getElementById('filter-sort').value = 'newest';
    
    applyFilters();
  } catch (err) {
    console.error('Explorer fetch failed:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <p class="error-text" style="color: var(--danger); margin-bottom: 1rem;">We couldn't reach the NASA archives. Please check your connection.</p>
        <button type="button" class="btn btn-secondary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

function bindGridClicks(container) {
  container.addEventListener('click', (e) => {
    const card = e.target.closest('.apod-card');
    if (!card) return;
    
    const date = card.dataset.date;
    if (date) {
      setView('apod');
      setUrlDate(date);
      window.dispatchEvent(new CustomEvent('load-apod', { detail: { date } }));
    }
  });
  
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.apod-card');
      if (card) {
        e.preventDefault();
        card.click();
      }
    }
  });
}
