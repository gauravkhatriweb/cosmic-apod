/**
 * Settings / Personalization Manager
 * Handles theming and motion preferences persisting to localStorage.
 */

import { storageGet, storageSet } from '../utils/storage.js';
import { initStars } from './stars.js';

const SETTINGS_KEY = 'cosmic_apod_settings';

const defaultSettings = {
  theme: 'cosmic-dark', // 'cosmic-dark' | 'high-contrast'
  reducedMotion: false,
};

let currentSettings = { ...defaultSettings };

export function initSettings() {
  const stored = storageGet(SETTINGS_KEY, null);
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    currentSettings = { ...defaultSettings, ...stored };
  } else {
    // Check OS preference for reduced motion as initial default if no setting saved
    const osReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    currentSettings.reducedMotion = osReducedMotion;
    storageSet(SETTINGS_KEY, currentSettings);
  }
  
  applySettings();
}

export function getSettings() {
  return { ...currentSettings };
}

export function updateSettings(updates) {
  currentSettings = { ...currentSettings, ...updates };
  storageSet(SETTINGS_KEY, currentSettings);
  applySettings();
}

function applySettings() {
  // Apply theme to document element
  document.documentElement.setAttribute('data-theme', currentSettings.theme);
  
  // Apply motion setting (handled partly by CSS variables or JS directly)
  if (currentSettings.reducedMotion) {
    document.documentElement.setAttribute('data-reduced-motion', 'true');
  } else {
    document.documentElement.removeAttribute('data-reduced-motion');
  }
}

export function bindSettingsUI() {
  const modal = document.getElementById('settings-modal');
  const btnSettings = document.getElementById('btn-settings');
  const btnClose = document.getElementById('settings-close');
  const backdrop = document.getElementById('settings-backdrop');
  
  const themeSelect = document.getElementById('theme-select');
  const motionToggle = document.getElementById('reduced-motion-toggle');
  
  if (!modal || !themeSelect || !motionToggle) return;
  
  // Init UI from state
  themeSelect.value = currentSettings.theme;
  motionToggle.checked = currentSettings.reducedMotion;
  
  // Listeners
  themeSelect.addEventListener('change', (e) => {
    updateSettings({ theme: e.target.value });
  });
  
  motionToggle.addEventListener('change', (e) => {
    updateSettings({ reducedMotion: e.target.checked });
    // Restart stars or hide them
    initStars();
  });
  
  const openModal = () => {
    modal.removeAttribute('hidden');
    themeSelect.focus();
  };
  
  const closeModal = () => modal.setAttribute('hidden', '');
  
  btnSettings?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  
  modal?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
    if (e.key === 'Tab') {
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first?.focus();
          e.preventDefault();
        }
      }
    }
  });
  
  // Listen for mobile menu custom event if we want, or just let main.js handle it
  document.addEventListener('open-settings', openModal);
}
