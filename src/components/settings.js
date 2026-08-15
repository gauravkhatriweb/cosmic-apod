/**
 * Settings / Personalization Manager
 * Handles theming and motion preferences persisting to localStorage.
 */

import { storageGet, storageSet } from '../utils/storage.js';
import { showToast } from '../utils/dom.js';
import { initStars } from './stars.js';

const SETTINGS_KEY = 'cosmic_apod_settings';

const defaultSettings = {
  theme: 'cosmic-dark', // 'cosmic-dark' | 'high-contrast'
  reducedMotion: false,
  defaultView: 'dashboard',
  nasaApiKey: '',
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
  
  const btnExport = document.getElementById('btn-export-data');
  const btnImport = document.getElementById('btn-import-data');
  const btnClearCache = document.getElementById('btn-clear-cache');
  const btnClearUserData = document.getElementById('btn-clear-userdata');
  const viewSelect = document.getElementById('default-view-select');
  const apiKeyInput = document.getElementById('nasa-api-key');
  const btnSaveKey = document.getElementById('btn-save-key');
  const btnRemoveKey = document.getElementById('btn-remove-key');
  
  if (!modal || !themeSelect || !motionToggle) return;
  
  // Init UI from state
  themeSelect.value = currentSettings.theme;
  motionToggle.checked = currentSettings.reducedMotion;
  if (viewSelect) viewSelect.value = currentSettings.defaultView || 'dashboard';
  if (apiKeyInput) apiKeyInput.value = currentSettings.nasaApiKey || '';
  
  // Listeners
  themeSelect.addEventListener('change', (e) => {
    updateSettings({ theme: e.target.value });
  });
  
  motionToggle.addEventListener('change', (e) => {
    updateSettings({ reducedMotion: e.target.checked });
    // Restart stars or hide them
    initStars();
  });
  
  viewSelect?.addEventListener('change', (e) => {
    updateSettings({ defaultView: e.target.value });
  });

  btnSaveKey?.addEventListener('click', () => {
    if (apiKeyInput) {
      updateSettings({ nasaApiKey: apiKeyInput.value.trim() });
      showToast('NASA API Key saved.', 'success');
    }
  });

  btnRemoveKey?.addEventListener('click', () => {
    if (apiKeyInput) {
      apiKeyInput.value = '';
      updateSettings({ nasaApiKey: '' });
      showToast('NASA API Key removed.', 'info');
    }
  });
  
  btnExport?.addEventListener('click', () => {
    // Collect data
    const data = {
      settings: storageGet(SETTINGS_KEY, {}),
      favorites: storageGet('cosmic_apod_favorites', []),
      history: storageGet('cosmic_apod_history', []),
      collections: storageGet('cosmic_apod_collections', {})
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmic_apod_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  btnImport?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.settings) storageSet(SETTINGS_KEY, data.settings);
          if (data.favorites) storageSet('cosmic_apod_favorites', data.favorites);
          if (data.history) storageSet('cosmic_apod_history', data.history);
          if (data.collections) storageSet('cosmic_apod_collections', data.collections);
          showToast('Data imported successfully! Reloading...', 'info');
          setTimeout(() => location.reload(), 2000);
        } catch (err) {
          showToast('Invalid backup file.', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
  
  btnClearCache?.addEventListener('click', async () => {
    if (confirm('Clear all offline cached images and API data? Your favorites and collections will not be deleted.')) {
      try {
        const { clearCache } = await import('../api/cache.js');
        await clearCache();
        
        // Also clear Service Worker caches
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }
        showToast('Offline cache cleared.');
      } catch (e) {
        showToast('Failed to clear cache completely.', 'error');
      }
    }
  });

  btnClearUserData?.addEventListener('click', () => {
    if (confirm('WARNING: This will permanently delete all your Favorites, History, and Collections. This action cannot be undone.')) {
      localStorage.removeItem('cosmic_apod_favorites');
      localStorage.removeItem('cosmic_apod_history');
      localStorage.removeItem('cosmic_apod_collections');
      showToast('Personal data cleared. Reloading...', 'info');
      setTimeout(() => location.reload(), 2000);
    }
  });
  
  const openModal = () => {
    modal.removeAttribute('hidden');
    themeSelect.focus();
  };
  
  const closeModal = () => modal.setAttribute('hidden', '');
  
  document.getElementById('btn-settings')?.addEventListener('click', openModal);
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
