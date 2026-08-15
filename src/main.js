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
  randomDateString,
  formatDate,
} from './utils/dates.js';
import { $, setText, show, hide, escapeHtml, showToast } from './utils/dom.js';
import { isFavorited, toggleFavorite } from './components/favorites.js';
import { addToHistory } from './components/history.js';
import { initStars } from './components/stars.js';
import { openLightbox, initLightbox } from './components/lightbox.js';
import { openPanel, initPanel } from './components/panel.js';
import { shareApod, getDateFromUrl } from './components/share.js';

// ————————————————— App State ————————————————— //

let currentApod = null;
let currentDate = todayString();
let isLoading   = false;

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
};

// ————————————————— Core: Load APOD ————————————————— //

async function loadApod(date) {
  if (isLoading) return;
  isLoading = true;

  currentDate = clampDate(date || todayString());

  showLoadingState();
  updateDateControls();

  try {
    currentApod = await fetchApod(currentDate);
    addToHistory(currentApod);
    renderApod(currentApod);
    showHeroState();
  } catch (err) {
    showErrorState(err.message);
  } finally {
    isLoading = false;
  }
}

async function loadRandomApod() {
  if (isLoading) return;
  isLoading = true;

  showLoadingState();

  try {
    currentApod = await fetchRandomApod();
    currentDate = currentApod.date;
    addToHistory(currentApod);
    renderApod(currentApod);
    updateDateControls();
    showHeroState();
  } catch (err) {
    showErrorState(err.message);
  } finally {
    isLoading = false;
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
    els.heroMedia.appendChild(iframe);
  } else {
    const img = document.createElement('img');
    img.src = apod.url;
    img.alt = escapeHtml(apod.title);
    img.loading = 'eager';
    // Handle broken images
    img.onerror = () => {
      img.alt = 'Image could not be loaded';
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
    show(els.readMore);
    els.readMore.textContent = 'Read more';
  } else {
    hide(els.readMore);
    els.explanation.classList.add('expanded');
  }

  // Copyright
  if (apod.copyright) {
    setText(els.copyright, `© ${apod.copyright.trim()}`);
    show(els.copyright);
  } else {
    setText(els.copyright, 'Public Domain — NASA');
    show(els.copyright);
  }

  // Favorite button state
  updateFavoriteButton();

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

// ————————————————— UI State Transitions ————————————————— //

function showLoadingState() {
  show(els.loading);
  hide(els.error);
  hide(els.hero);
}

function showHeroState() {
  hide(els.loading);
  hide(els.error);
  show(els.hero);
}

function showErrorState(message) {
  hide(els.loading);
  hide(els.hero);
  setText(els.errorMessage, message);
  show(els.error);
}

// ————————————————— Date Controls ————————————————— //

function updateDateControls() {
  // Set the date picker value
  if (els.datePicker) {
    els.datePicker.value = currentDate;
    els.datePicker.min = APOD_START_DATE;
    els.datePicker.max = todayString();
  }

  // Disable prev/next at boundaries
  if (els.prevBtn) els.prevBtn.disabled = isMinDate(currentDate);
  if (els.nextBtn) els.nextBtn.disabled = isMaxDate(currentDate);
}

// ————————————————— Favorite Button ————————————————— //

function updateFavoriteButton() {
  if (!els.favBtn || !currentApod) return;
  const fav = isFavorited(currentApod.date);
  els.favBtn.classList.toggle('favorited', fav);
  els.favBtn.setAttribute('aria-pressed', String(fav));
  const label = els.favBtn.querySelector('.action-label');
  if (label) label.textContent = fav ? 'Favorited' : 'Favorite';
}

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
  // Date navigation
  els.prevBtn?.addEventListener('click', () => {
    loadApod(shiftDate(currentDate, -1));
  });

  els.nextBtn?.addEventListener('click', () => {
    loadApod(shiftDate(currentDate, 1));
  });

  els.datePicker?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) loadApod(val);
  });

  // Header navigation
  els.todayBtn?.addEventListener('click', () => loadApod(todayString()));
  els.randomBtn?.addEventListener('click', () => loadRandomApod());
  els.favNavBtn?.addEventListener('click', () => openPanel('favorites', (date) => loadApod(date)));
  els.historyNavBtn?.addEventListener('click', () => openPanel('history', (date) => loadApod(date)));

  // Hero actions
  els.readMore?.addEventListener('click', () => {
    const isExpanded = els.explanation.classList.toggle('expanded');
    els.readMore.textContent = isExpanded ? 'Read less' : 'Read more';
  });

  els.favBtn?.addEventListener('click', () => {
    if (!currentApod) return;
    const nowFav = toggleFavorite(currentApod);
    updateFavoriteButton();
    showToast(nowFav ? 'Added to favorites ★' : 'Removed from favorites');
  });

  els.shareBtn?.addEventListener('click', () => {
    if (currentApod) shareApod(currentApod);
  });

  els.fullscreenBtn?.addEventListener('click', () => {
    if (currentApod) openLightbox(currentApod);
  });

  // Retry
  els.retryBtn?.addEventListener('click', () => loadApod(currentDate));

  // Mobile menu
  els.mobileToggle?.addEventListener('click', toggleMobileMenu);

  // Mobile menu buttons (event delegation)
  els.mobileMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('.mobile-nav-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    closeMobileMenu();
    switch (action) {
      case 'today':     loadApod(todayString()); break;
      case 'random':    loadRandomApod(); break;
      case 'favorites': openPanel('favorites', (date) => loadApod(date)); break;
      case 'history':   openPanel('history', (date) => loadApod(date)); break;
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

    switch (e.key) {
      case 'ArrowLeft':
        if (!isMinDate(currentDate)) loadApod(shiftDate(currentDate, -1));
        break;
      case 'ArrowRight':
        if (!isMaxDate(currentDate)) loadApod(shiftDate(currentDate, 1));
        break;
    }
  });
}

// ————————————————— Init ————————————————— //

function init() {
  // Atmospheric effects
  initStars();

  // Component init
  initLightbox();
  initPanel();

  // Bind all events
  bindEvents();

  // Check URL for a shared date
  const urlDate = getDateFromUrl();
  const startDate = urlDate || todayString();

  // Load initial APOD
  loadApod(startDate);
}

// Start the application
init();
