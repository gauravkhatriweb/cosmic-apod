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
import { initStars } from './components/stars.js';
import { openLightbox, initLightbox } from './components/lightbox.js';
import { openPanel, initPanel } from './components/panel.js';
import { shareApod, getDateFromUrl, setUrlDate } from './components/share.js';
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
      setApodError(err.message);
    }
  }
}

async function loadRandomApod() {
  setDateLoading(getState().currentDate); // Show loading temporarily

  try {
    const apod = await fetchRandomApod();
    setUrlDate(apod.date);
    addToHistory(apod);
    setApodSuccess(apod);
  } catch (err) {
    if (err.name !== 'AbortError') {
      setApodError(err.message);
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

  // Handle View visibility
  if (state.currentView === 'dashboard') {
    show(els.viewDashboard);
    hide(els.viewExplorer);
    hide(els.viewApod);
    renderDashboard();
  } else if (state.currentView === 'explorer') {
    hide(els.viewDashboard);
    show(els.viewExplorer);
    hide(els.viewApod);
    renderExplorer();
  } else if (state.currentView === 'apod') {
    hide(els.viewDashboard);
    hide(els.viewExplorer);
    show(els.viewApod);
  }

  // Handle APOD loading/success/error within APOD view
  if (state.status === 'loading') {
    show(els.loading);
    hide(els.error);
    hide(els.hero);
  } else if (state.status === 'error') {
    hide(els.loading);
    hide(els.hero);
    setText(els.errorMessage, state.errorDetails);
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
  
  els.randomBtn?.addEventListener('click', () => {
    setView('apod');
    loadRandomApod();
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
      case 'random':    setView('apod'); loadRandomApod(); break;
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
      if (urlDate === 'dashboard' || urlDate === 'explorer') {
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

  // Check URL for a shared date
  const urlDate = getDateFromUrl();
  
  // Basic routing
  if (urlDate === 'dashboard') {
    setView('dashboard');
  } else if (urlDate === 'explorer') {
    setView('explorer');
  } else {
    setView('apod');
    loadApod(urlDate || todayString());
  }

  // Listen for internal navigation events
  window.addEventListener('load-apod', (e) => {
    if (e.detail && e.detail.date) {
      loadApod(e.detail.date);
    }
  });
}

// Start the application
init();
