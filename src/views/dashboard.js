import { fetchApod, fetchMultipleApods } from '../api/nasa.js';
import { todayString, shiftDate } from '../utils/dates.js';
import { createApodCard, createSkeletonCards, createDashboardHero } from '../components/ui.js';
import { setView } from '../state/store.js';
import { setUrlDate, shareApod } from '../components/share.js';
import { toggleFavorite } from '../components/favorites.js';
import { showToast } from '../utils/dom.js';

let todayApodCache = null;
let isDashboardBound = false;

export async function renderDashboard() {
  const container = document.getElementById('view-dashboard');
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- 1. Hero -->
      <section class="dashboard-section" id="dash-hero-container">
        <div class="skeleton" style="height: 400px; border-radius: var(--radius-xl);"></div>
      </section>

      <!-- 2. Discovery -->
      <section class="dashboard-section" id="dash-discovery">
        <h3 class="section-title">Discovery</h3>
        <div class="card-grid" id="grid-discovery">
          ${createSkeletonCards(3)}
        </div>
      </section>
      
      <!-- 3. Personal -->
      <section class="dashboard-section" id="dash-personal">
        <h3 class="section-title">Personal <button class="btn btn-secondary btn-sm" id="btn-dash-favs" style="float:right;">View All Favorites</button></h3>
        <div class="card-grid" id="grid-personal">
          ${createSkeletonCards(2)}
        </div>
      </section>
      
      <!-- 4. Learning -->
      <section class="dashboard-section" id="dash-learning">
        <h3 class="section-title">Top Cosmic Tags</h3>
        <div class="apod-tags-wrap" id="dash-tags" style="gap: var(--space-sm);">
          <span class="apod-tag skeleton" style="width: 60px; height: 24px;"></span>
          <span class="apod-tag skeleton" style="width: 80px; height: 24px;"></span>
          <span class="apod-tag skeleton" style="width: 50px; height: 24px;"></span>
        </div>
      </section>
    </div>
  `;

  if (!isDashboardBound) {
    bindGridClicks(container);
    isDashboardBound = true;
  }

  // Fetch Data
  try {
    const today = todayString();
    
    // 1. Hero (Today)
    todayApodCache = await fetchApod(today);
    const heroContainer = document.getElementById('dash-hero-container');
    heroContainer.innerHTML = createDashboardHero(todayApodCache);
    
    // Setup persistent delegation for dynamic inner buttons
    heroContainer.addEventListener('click', (e) => {
      if (e.target.closest('.btn-explore-hero')) {
        setView('explorer');
        const url = new URL(window.location);
        url.searchParams.delete('date');
        window.history.replaceState({}, '', url);
      }
      else if (e.target.closest('.btn-fav-hero')) {
        const nowFav = toggleFavorite(todayApodCache);
        showToast(nowFav ? 'Added to favorites ★' : 'Removed from favorites');
      }
      else if (e.target.closest('.btn-share-hero')) {
        shareApod(todayApodCache);
      }
    });

    // 2. Discovery (Random + OTD)
    const randomApods = await fetchMultipleApods({ count: 2 });
    
    const todayDateObj = new Date(today);
    todayDateObj.setFullYear(todayDateObj.getFullYear() - 1);
    const otdString = todayDateObj.toISOString().split('T')[0];
    const otdApod = await fetchApod(otdString);
    
    document.getElementById('grid-discovery').innerHTML = [otdApod, ...randomApods].map(createApodCard).join('');

    // 3. Personal (Favorites Preview)
    const { getFavorites } = await import('../components/favorites.js');
    const favs = getFavorites().slice(0, 3); // top 3
    if (favs.length > 0) {
      document.getElementById('grid-personal').innerHTML = favs.map(createApodCard).join('');
    } else {
      document.getElementById('grid-personal').innerHTML = '<p class="empty-text">No favorites yet. Heart some APODs to see them here.</p>';
    }
    
    // 4. Learning (Tags)
    const dashTags = document.getElementById('dash-tags');
    dashTags.innerHTML = 
      ['Galaxy', 'Nebula', 'Black Hole', 'Planet', 'Star', 'Moon', 'Night Sky']
        .map(t => `<button class="apod-tag tag-btn" data-tag="${t}">${t}</button>`)
        .join('');
        
    // Bind once via parent container to avoid leaks
    if (!dashTags.dataset.bound) {
      dashTags.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-btn')) {
          const tag = e.target.dataset.tag;
          setView('explorer');
          window.dispatchEvent(new CustomEvent('filter-explorer', { detail: { tag } }));
        }
      });
      dashTags.dataset.bound = 'true';
    }

  } catch (err) {
    console.error('Failed to load dashboard:', err);
    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Discovery Dashboard</h2>
        <p class="error-text">We couldn't reach the NASA archives. Please check your connection.</p>
        <button type="button" class="btn btn-secondary" onclick="location.reload()" style="margin-top: 1rem;">Retry</button>
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
      // Trigger load sequence
      setView('apod');
      setUrlDate(date);
      // We must tell main.js to load the APOD. 
      // The cleanest way is dispatching a custom event that main.js listens to,
      // or we can import the load function, but let's dispatch an event to decouple.
      window.dispatchEvent(new CustomEvent('load-apod', { detail: { date } }));
    }
  });
  
  // Keyboard support
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.apod-card');
      if (card) {
        e.preventDefault();
        card.click();
      }
    }
  });
  
  // Dashboard global clicks (e.g. view all favorites)
  container.addEventListener('click', (e) => {
    if (e.target.closest('#btn-dash-favs')) {
      document.getElementById('btn-favorites')?.click();
    }
  });
}
