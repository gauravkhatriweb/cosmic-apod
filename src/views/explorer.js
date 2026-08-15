import { fetchMultipleApods } from '../api/nasa.js';
import { createApodCard, createSkeletonCards } from '../components/ui.js';
import { setView } from '../state/store.js';
import { setUrlDate } from '../components/share.js';
import { todayString, shiftDate } from '../utils/dates.js';

export async function renderExplorer() {
  const container = document.getElementById('view-explorer');
  if (!container) return;

  container.innerHTML = `
    <div class="explorer-header">
      <h2>Cosmic Archive</h2>
      <p>Browse random discoveries from the past three decades.</p>
      <div class="explorer-actions">
        <button class="btn btn-primary" id="btn-explore-random">Shuffle Randomly</button>
        <button class="btn btn-secondary" id="btn-explore-recent">Last 20 Days</button>
      </div>
    </div>
    
    <div class="card-grid" id="grid-explorer">
      ${createSkeletonCards(12)}
    </div>
  `;

  bindGridClicks(container);

  // Bind Buttons
  const btnRandom = document.getElementById('btn-explore-random');
  const btnRecent = document.getElementById('btn-explore-recent');
  
  btnRandom.addEventListener('click', () => loadExplorerData({ count: 20 }));
  btnRecent.addEventListener('click', () => {
    const today = todayString();
    const past = shiftDate(today, -19);
    loadExplorerData({ start_date: past, end_date: today });
  });

  // Default load
  loadExplorerData({ count: 12 });
}

async function loadExplorerData(params) {
  const grid = document.getElementById('grid-explorer');
  if (!grid) return;
  
  grid.innerHTML = createSkeletonCards(params.count || 20);
  
  try {
    const apods = await fetchMultipleApods(params);
    // If it's a date range, reverse it so newest is first
    if (params.start_date) {
      apods.reverse();
    }
    grid.innerHTML = apods.map(createApodCard).join('');
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
