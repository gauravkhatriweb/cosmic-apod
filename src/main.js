/**
 * Cosmic APOD — Main Application
 *
 * Entry point that wires together all components:
 * API, date navigation, favorites, history, lightbox, sharing, star field.
 */

import { fetchApod, fetchRandomApod, APOD_START_DATE } from './api/nasa.js';
import {
  todayString,
  shiftDate,
  clampDate,
  isMinDate,
  isMaxDate,
  formatDate,
} from './utils/dates.js';
import { initSettings, bindSettingsUI } from './components/settings.js';
import { $, setText, show, hide, escapeHtml, showToast } from './utils/dom.js';
import { isFavorited, toggleFavorite } from './components/favorites.js';
import { addToHistory } from './components/history.js';
import { renderDashboard } from './views/dashboard.js';
import { renderExplorer } from './views/explorer.js';
import { renderCollections } from './views/collections.js';
import { initStars } from './components/stars.js';
import { openLightbox, initLightbox } from './components/lightbox.js';
import { openPanel, initPanel } from './components/panel.js';
import { shareApod, getDateFromUrl, setUrlDate } from './components/share.js';
import { deserializeCollectionFromUrl, importCollection } from './components/collections.js';
import { generateAITags } from './services/tagging/tagger-core.js';
import {
  getState,
  subscribe,
  setDateLoading,
  setApodSuccess,
  setApodError,
  setView,
} from './state/store.js';

// ————————————————— DOM References ————————————————— //

const els = {
  loading:       $('#loading-state'),
  error:         $('#error-state'),
  errorMessage:  $('#error-message'),
  offlineBanner: $('#offline-banner'),
  hero:          $('#apod-hero'),
  heroMedia:     $('#hero-media'),
  mediaType:     $('#apod-media-type'),
  date:          $('#apod-date'),
  title:         $('#apod-title'),
  explanation:   $('#apod-explanation'),
  readMore:      $('#btn-read-more'),
  copyright:     $('#apod-copyright'),
  favBtn:        $('#btn-favorite'),
  shareBtn:      $('#btn-share'),
  fullscreenBtn: $('#btn-fullscreen'),
  hdBtn:         $('#btn-hd'),
  eduToggleBtn:  $('#btn-education-toggle'),
  eduPanel:      $('#education-panel'),
  eduDate:       $('#edu-date'),
  eduMedia:      $('#edu-media'),
  datePicker:    $('#date-picker'),
  prevBtn:       $('#btn-prev'),
  nextBtn:       $('#btn-next'),
  todayBtn:      $('#btn-today'),
  randomBtn:     $('#btn-random'),
  favNavBtn:     $('#btn-favorites'),
  historyNavBtn: $('#btn-history'),
  retryBtn:      $('#btn-retry'),
  mobileToggle:  $('#mobile-menu-toggle'),
  mobileMenu:    $('#mobile-menu'),
  viewDashboard: $('#view-dashboard'),
  viewExplorer:  $('#view-explorer'),
  viewApod:      $('#view-apod'),
  navDashboardBtn: $('#btn-nav-dashboard'),
  navExplorerBtn: $('#btn-nav-explorer'),
  navCollectionsBtn: $('#btn-nav-collections'),
  viewCollections: $('#view-collections'),
  tagsContainer: $('#apod-tags-container'),
};

// ————————————————— Core: Load APOD ————————————————— //

async function loadApod(date) {
  const { status } = getState();
  // Allow switching dates even if currently loading to cancel previous req
  const safeDate = clampDate(date || todayString());
  
  setDateLoading(safeDate);
  setUrlDate(safeDate);

  try {
    const apod = await fetchApod(safeDate);
    addToHistory(apod);
    setApodSuccess(apod);
  } catch (err) {
    if (err.name !== 'AbortError') {
      setApodError(err);
    }
  }
}


// ————————————————— Render ————————————————— //

function renderApod(apod) {
  // Media
  els.heroMedia.innerHTML = '';

  if (apod.media_type === 'video') {
    const iframe = document.createElement('iframe');
    iframe.src = apod.url;
    iframe.title = escapeHtml(apod.title);
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    
    // Improve fallback accessibility for iframe if blocked
    iframe.innerHTML = `<a href="${escapeHtml(apod.url)}" target="_blank" rel="noopener">Watch video on external site</a>`;
    
    els.heroMedia.appendChild(iframe);
  } else {
    const img = document.createElement('img');
    img.src = apod.url;
    img.crossOrigin = 'anonymous'; // Required for TFJS
    img.alt = escapeHtml(apod.title);
    img.loading = 'eager';
    img.decoding = 'async'; // V2 Performance upgrade
    // Handle broken images
    img.onerror = () => {
      img.alt = 'Image could not be loaded. This might be due to a removed resource on NASA servers.';
      img.style.objectFit = 'contain';
    };
    els.heroMedia.appendChild(img);
  }

  // Meta
  setText(els.mediaType, apod.media_type === 'video' ? '🎬 Video' : '📷 Image');
  setText(els.date, formatDate(apod.date));

  // Title
  setText(els.title, apod.title);

  // Tags
  if (els.tagsContainer) {
    els.tagsContainer.innerHTML = '';
    if (apod.tags && apod.tags.length > 0) {
      els.tagsContainer.innerHTML = apod.tags.map(t => `<span class="apod-tag">${escapeHtml(t)}</span>`).join('');
    }
    
    // Add "Generate AI Tags" button if it's an image
    if (apod.media_type === 'image') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-sm';
      btn.textContent = '✨ Generate AI Tags';
      btn.style.marginLeft = '0.5rem';
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = 'Analyzing...';
        const img = els.heroMedia.querySelector('img');
        if (img) {
          const aiTags = await generateAITags(img);
          if (aiTags) {
            apod.tags = Array.from(new Set([...(apod.tags || []), ...aiTags]));
            renderApod(apod); // re-render to update tags
          } else {
            btn.textContent = '✨ Generate AI Tags';
            btn.disabled = false;
          }
        }
      };
      els.tagsContainer.appendChild(btn);
    }
  }

  // Explanation
  setText(els.explanation, apod.explanation);
  els.explanation.classList.remove('expanded');

  // Show read-more only if the text is long enough to overflow
  if (apod.explanation.length > 400) {
    if (els.readMore) {
      show(els.readMore);
      els.readMore.textContent = 'Read more';
    }
  } else {
    if (els.readMore) hide(els.readMore);
    els.explanation.classList.add('expanded');
  }

  // Update education panel content
  if (els.eduDate) els.eduDate.textContent = apod.date;
  if (els.eduMedia) els.eduMedia.textContent = apod.media_type.charAt(0).toUpperCase() + apod.media_type.slice(1);
    
  // Hide education panel by default when new APOD loads
  if (els.eduPanel && els.eduToggleBtn) {
    hide(els.eduPanel);
    els.eduToggleBtn.setAttribute('aria-expanded', 'false');
  }

  // Copyright
  if (apod.copyright) {
    setText(els.copyright, `© ${apod.copyright.trim()}`);
    show(els.copyright);
  } else {
    setText(els.copyright, 'Public Domain — NASA');
    show(els.copyright);
  }

  // Favorite button state is now handled by the store subscriber

  // HD link
  if (apod.hdurl && apod.media_type !== 'video') {
    els.hdBtn.href = apod.hdurl;
    show(els.hdBtn);
  } else {
    hide(els.hdBtn);
  }

  // Fullscreen button — show for both images and videos
  show(els.fullscreenBtn);
}

// ————————————————— UI State Subscriptions ————————————————— //

subscribe((state) => {
  // Update Date Controls
  if (els.datePicker) {
    els.datePicker.value = state.currentDate;
    els.datePicker.min = APOD_START_DATE;
    els.datePicker.max = todayString();
  }
  if (els.prevBtn) els.prevBtn.disabled = isMinDate(state.currentDate);
  if (els.nextBtn) els.nextBtn.disabled = isMaxDate(state.currentDate);

  // Update Favorite Button Status
  if (els.favBtn && state.currentApod) {
    const fav = isFavorited(state.currentApod.date);
    els.favBtn.classList.toggle('favorited', fav);
    els.favBtn.setAttribute('aria-pressed', String(fav));
    const label = els.favBtn.querySelector('.action-label');
    if (label) label.textContent = fav ? 'Favorited' : 'Favorite';
  }

  // Update Global Navigation Active State
  const navMap = {
    'dashboard': els.navDashboardBtn,
    'explorer': els.navExplorerBtn,
    'apod': els.todayBtn, // Treat "Today" or APOD view as the APOD tab
    'collections': els.navCollectionsBtn
  };
  
  // Clear all
  Object.values(navMap).forEach(btn => {
    if (btn) btn.removeAttribute('aria-current');
  });
  
  // Set active
  const activeBtn = navMap[state.currentView];
  if (activeBtn) activeBtn.setAttribute('aria-current', 'page');
  
  // Mobile Nav map
  const mobileNavMap = {
    'dashboard': els.mobileMenu?.querySelector('[data-action="dashboard"]'),
    'explorer': els.mobileMenu?.querySelector('[data-action="explorer"]'),
    'apod': els.mobileMenu?.querySelector('[data-action="today"]'),
    'collections': els.mobileMenu?.querySelector('[data-action="collections"]')
  };
  
  Object.values(mobileNavMap).forEach(btn => {
    if (btn) btn.removeAttribute('aria-current');
  });
  
  const activeMobileBtn = mobileNavMap[state.currentView];
  if (activeMobileBtn) activeMobileBtn.setAttribute('aria-current', 'page');

  // Handle View visibility
  if (state.currentView === 'dashboard') {
    show(els.viewDashboard);
    hide(els.viewExplorer);
    hide(els.viewApod);
    if (els.viewCollections) hide(els.viewCollections);
    renderDashboard();
  } else if (state.currentView === 'explorer') {
    hide(els.viewDashboard);
    show(els.viewExplorer);
    hide(els.viewApod);
    if (els.viewCollections) hide(els.viewCollections);
    renderExplorer();
  } else if (state.currentView === 'collections') {
    hide(els.viewDashboard);
    hide(els.viewExplorer);
    hide(els.viewApod);
    if (els.viewCollections) show(els.viewCollections);
    renderCollections();
  } else if (state.currentView === 'apod') {
    hide(els.viewDashboard);
    hide(els.viewExplorer);
    if (els.viewCollections) hide(els.viewCollections);
    show(els.viewApod);
  }

  // Handle Offline status
  if (els.offlineBanner) {
    if (state.isOffline) show(els.offlineBanner);
    else hide(els.offlineBanner);
  }

  // Handle APOD loading/success/error within APOD view
  if (state.status === 'loading') {
    show(els.loading);
    hide(els.error);
    hide(els.hero);
  } else if (state.status === 'error') {
    hide(els.loading);
    hide(els.hero);
    const err = state.errorDetails;
    if (err && err.code === 'RATE_LIMITED') {
      els.errorMessage.innerHTML = `
        <div style="text-align: center;">
          <h2 style="font-family: var(--font-display); margin-bottom: 0.5rem;">🌌 You've reached the NASA API limit</h2>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">Cosmic APOD has temporarily reached the request limit for the current API key.</p>
          ${err.reset ? `<p style="margin-bottom: 1.5rem;"><strong>The limit should reset at:</strong><br>${new Date(err.reset * 1000).toLocaleTimeString()}</p>` : `<p style="margin-bottom: 1.5rem;">NASA's API does not provide a precise reset time for this request. Please try again later.</p>`}
          <p style="font-size: 0.9rem; color: var(--text-muted);">You can wait for the limit to reset, or add your own NASA API key to continue exploring.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="document.dispatchEvent(new Event('open-settings'))">Add API Key in Settings</button>
        </div>
      `;
    } else if (err && err.code === 'INVALID_KEY') {
      els.errorMessage.innerHTML = `
        <div style="text-align: center;">
          <h2 style="font-family: var(--font-display); margin-bottom: 0.5rem;">🔑 Invalid API Key</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">This NASA API key doesn't appear to be valid.</p>
          <button class="btn btn-primary" onclick="document.dispatchEvent(new Event('open-settings'))">Update API Key in Settings</button>
        </div>
      `;
    } else {
      els.errorMessage.textContent = err?.message || 'An unknown error occurred.';
    }
    show(els.error);
  } else if (state.status === 'success') {
    renderApod(state.currentApod);
    hide(els.loading);
    hide(els.error);
    show(els.hero);
  }
});

// ————————————————— Mobile Menu ————————————————— //

function toggleMobileMenu() {
  const expanded = els.mobileToggle.getAttribute('aria-expanded') === 'true';
  els.mobileToggle.setAttribute('aria-expanded', String(!expanded));
  if (expanded) {
    els.mobileMenu.setAttribute('hidden', '');
  } else {
    els.mobileMenu.removeAttribute('hidden');
  }
}

function closeMobileMenu() {
  els.mobileToggle?.setAttribute('aria-expanded', 'false');
  els.mobileMenu?.setAttribute('hidden', '');
}

// ————————————————— Event Binding ————————————————— //

function bindEvents() {
  els.prevBtn?.addEventListener('click', () => {
    loadApod(shiftDate(getState().currentDate, -1));
  });

  els.nextBtn?.addEventListener('click', () => {
    loadApod(shiftDate(getState().currentDate, 1));
  });

  els.datePicker?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) loadApod(val);
  });

  // Header navigation
  els.navDashboardBtn?.addEventListener('click', () => {
    setView('dashboard');
    setUrlDate('dashboard');
  });
  
  els.navExplorerBtn?.addEventListener('click', () => {
    setView('explorer');
    setUrlDate('explorer');
  });

  els.todayBtn?.addEventListener('click', () => {
    setView('apod');
    loadApod(todayString());
  });
  
  els.navCollectionsBtn?.addEventListener('click', () => {
    setView('collections');
    setUrlDate('collections');
  });

  els.favNavBtn?.addEventListener('click', () => openPanel('favorites', (date) => loadApod(date)));
  els.historyNavBtn?.addEventListener('click', () => openPanel('history', (date) => loadApod(date)));

  // Hero actions
  els.eduToggleBtn?.addEventListener('click', () => {
    const isHidden = els.eduPanel.hasAttribute('hidden');
    if (isHidden) {
      show(els.eduPanel);
      els.eduToggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      hide(els.eduPanel);
      els.eduToggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  els.readMore?.addEventListener('click', () => {
    const isExpanded = els.explanation.classList.contains('expanded');
    if (isExpanded) {
      els.explanation.classList.remove('expanded');
      els.readMore.textContent = 'Read more';
    } else {
      els.explanation.classList.add('expanded');
      els.readMore.textContent = 'Show less';
    }
  });

  els.favBtn?.addEventListener('click', () => {
    const { currentApod } = getState();
    if (!currentApod) return;
    const nowFav = toggleFavorite(currentApod);
    
    // Force a re-render of button via store subscriber by making a harmless state update,
    // or manually trigger. Easiest is to manually update DOM here since it's localized.
    els.favBtn.classList.toggle('favorited', nowFav);
    els.favBtn.setAttribute('aria-pressed', String(nowFav));
    const label = els.favBtn.querySelector('.action-label');
    if (label) label.textContent = nowFav ? 'Favorited' : 'Favorite';
    
    showToast(nowFav ? 'Added to favorites ★' : 'Removed from favorites');
  });

  els.shareBtn?.addEventListener('click', () => {
    const { currentApod } = getState();
    if (currentApod) shareApod(currentApod);
  });

  els.fullscreenBtn?.addEventListener('click', () => {
    const { currentApod } = getState();
    if (currentApod) openLightbox(currentApod);
  });

  // Retry
  els.retryBtn?.addEventListener('click', () => loadApod(getState().currentDate));

  // Mobile menu
  els.mobileToggle?.addEventListener('click', toggleMobileMenu);

  // Mobile menu buttons (event delegation)
  els.mobileMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('.mobile-nav-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    closeMobileMenu();
    switch (action) {
      case 'dashboard': setView('dashboard'); break;
      case 'explorer':  setView('explorer'); break;
      case 'today':     setView('apod'); loadApod(todayString()); break;
      case 'collections': setView('collections'); break;
      case 'favorites': openPanel('favorites', (date) => loadApod(date)); break;
      case 'history':   openPanel('history', (date) => loadApod(date)); break;
      case 'settings':  document.dispatchEvent(new Event('open-settings')); break;
    }
  });

  // Keyboard: Escape closes mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // Keyboard shortcuts (when no modal/panel is open)
  document.addEventListener('keydown', (e) => {
    // Don't intercept if an input is focused or a modal is open
    if (e.target.tagName === 'INPUT') return;
    if (!$('#side-panel[hidden]') || !$('#lightbox[hidden]')) return;

    const { currentDate } = getState();
    switch (e.key) {
      case 'ArrowLeft':
        if (!isMinDate(currentDate)) loadApod(shiftDate(currentDate, -1));
        break;
      case 'ArrowRight':
        if (!isMaxDate(currentDate)) loadApod(shiftDate(currentDate, 1));
        break;
    }
  });

  // Listen for browser back/forward URL changes
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      setView(e.state.view);
      if (e.state.view === 'apod' && e.state.date) {
        loadApod(e.state.date);
      }
    } else {
      const urlDate = getDateFromUrl();
      if (['dashboard', 'explorer', 'collections'].includes(urlDate)) {
        setView(urlDate);
      } else {
        setView('apod');
        loadApod(urlDate || todayString());
      }
    }
  });
}

// ————————————————— Init ————————————————— //

function init() {
  // Init user preferences first
  initSettings();

  // Atmospheric effects
  initStars();

  // Component init
  initLightbox();
  initPanel();
  bindSettingsUI();

  // Bind all events
  bindEvents();

  // Check URL for a shared collection
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCol = urlParams.get('collection');
  if (sharedCol) {
    const col = deserializeCollectionFromUrl(sharedCol);
    if (col) {
      showSharedCollectionPreview(col, sharedCol);
      return; // Skip normal routing until user acts
    }
  }

  // Check URL for a shared date
  const urlDate = getDateFromUrl();
  
  // Basic routing
  if (['dashboard', 'explorer', 'collections'].includes(urlDate)) {
    setView(urlDate);
  } else if (urlDate) {
    setView('apod');
    loadApod(urlDate);
  } else {
    // If no URL parameter, use default view
    import('./components/settings.js').then(m => {
      const { defaultView } = m.getSettings();
      if (defaultView === 'apod') {
        setView('apod');
        loadApod(todayString());
      } else {
        setView(defaultView || 'dashboard');
        setUrlDate(defaultView || 'dashboard');
      }
    });
  }

  // Listen for internal navigation events
  window.addEventListener('load-apod', (e) => {
    if (e.detail && e.detail.date) {
      loadApod(e.detail.date);
    }
  });
}
// ————————————————— Shared Collection Preview ————————————————— //

function showSharedCollectionPreview(col, b64Data) {
  // Create a modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.style.display = 'block';
  overlay.style.zIndex = '9999';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'lightbox-backdrop';
  overlay.appendChild(backdrop);
  
  const content = document.createElement('div');
  content.className = 'panel-content';
  content.style.cssText = 'position: relative; z-index: 10000; max-width: 600px; margin: 10vh auto; background: var(--bg-surface); padding: 2rem; border-radius: var(--radius-lg); text-align: center;';
  
  content.innerHTML = `
    <h2 style="margin-bottom: 0.5rem; font-family: var(--font-display);">🔗 Shared Collection</h2>
    <h3 style="margin-bottom: 1rem; color: var(--accent);">${escapeHtml(col.name)}</h3>
    <p style="margin-bottom: 2rem; color: var(--text-muted);">This collection contains <strong>${col.items.length}</strong> items.</p>
    
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button class="btn btn-secondary" id="btn-cancel-import">Cancel</button>
      <button class="btn btn-primary" id="btn-confirm-import">Import Collection</button>
    </div>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  const finish = (shouldImport) => {
    document.body.removeChild(overlay);
    const url = new URL(window.location);
    url.searchParams.delete('collection');
    window.history.replaceState({}, '', url);
    
    if (shouldImport) {
      importCollection(col.name, col.items);
      setView('collections');
      showToast('Collection imported successfully!', 'success');
    } else {
      // Proceed with normal load
      const urlDate = getDateFromUrl();
      if (['dashboard', 'explorer', 'collections'].includes(urlDate)) {
        setView(urlDate);
      } else {
        setView('dashboard');
      }
    }
  };
  
  document.getElementById('btn-confirm-import').addEventListener('click', () => finish(true));
  document.getElementById('btn-cancel-import').addEventListener('click', () => finish(false));
}

// Start the application
init();
