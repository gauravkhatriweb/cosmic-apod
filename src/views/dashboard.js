import { fetchApod, fetchMultipleApods, fetchRandomApod } from '../api/nasa.js';
import { todayString, shiftDate } from '../utils/dates.js';
import { createApodCard, createSkeletonCards } from '../components/ui.js';
import { setView } from '../state/store.js';
import { setUrlDate } from '../components/share.js';

export async function renderDashboard() {
  const container = document.getElementById('view-dashboard');
  if (!container) return;

  // Basic HTML structure
  container.innerHTML = `
    <div class="dashboard-header">
      <h2>Discovery Dashboard</h2>
      <p>Your daily portal to the cosmos.</p>
    </div>
    
    <div class="dashboard-grid">
      <section class="dashboard-section" id="dash-today">
        <h3>Today's Feature</h3>
        <div class="card-grid" id="grid-today">
          ${createSkeletonCards(1)}
        </div>
      </section>

      <section class="dashboard-section" id="dash-on-this-day">
        <h3>On This Day (Last Year)</h3>
        <div class="card-grid" id="grid-otd">
          ${createSkeletonCards(1)}
        </div>
      </section>
      
      <section class="dashboard-section" id="dash-recent">
        <h3>Recent Discoveries</h3>
        <div class="card-grid" id="grid-recent">
          ${createSkeletonCards(3)}
        </div>
      </section>
    </div>
  `;

  bindGridClicks(container);

  // Fetch Data
  try {
    const today = todayString();
    
    // 1. Today
    const todayApod = await fetchApod(today);
    document.getElementById('grid-today').innerHTML = createApodCard(todayApod);
    
    // 2. On This Day
    const todayDateObj = new Date(today);
    todayDateObj.setFullYear(todayDateObj.getFullYear() - 1);
    const otdString = todayDateObj.toISOString().split('T')[0];
    const otdApod = await fetchApod(otdString);
    document.getElementById('grid-otd').innerHTML = createApodCard(otdApod);

    // 3. Recent (Last 3 days before today)
    const endRecent = shiftDate(today, -1);
    const startRecent = shiftDate(today, -3);
    const recentApods = await fetchMultipleApods({ start_date: startRecent, end_date: endRecent });
    
    // API returns dates in chronological order, reverse to show newest first
    document.getElementById('grid-recent').innerHTML = recentApods.reverse().map(createApodCard).join('');
    
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Discovery Dashboard</h2>
        <p style="color: var(--danger);">We couldn't reach the NASA archives. Please check your connection.</p>
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
}
