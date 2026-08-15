/**
 * Centralized application state store.
 *
 * Implements a simple reactive pattern: state is private, accessed via getter,
 * mutated via dispatcher, and components subscribe to changes.
 */

import { todayString } from '../utils/dates.js';

// Define initial state shape
const state = {
  currentView: 'dashboard', // 'dashboard' | 'explorer' | 'apod'
  currentApod: null,
  currentDate: todayString(),
  status: 'idle', // 'idle' | 'loading' | 'error' | 'success'
  errorDetails: null,
};

const listeners = new Set();

/**
 * Get a read-only snapshot of the current state.
 */
export function getState() {
  return { ...state };
}

/**
 * Subscribe to state changes.
 * Returns an unsubscribe function.
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Update the state with new values.
 */
function setState(updates) {
  let changed = false;
  for (const key in updates) {
    if (state[key] !== updates[key]) {
      state[key] = updates[key];
      changed = true;
    }
  }
  
  if (changed) {
    const snapshot = getState();
    listeners.forEach(listener => listener(snapshot));
  }
}

// --- Action Dispatchers ---

export function setDateLoading(date) {
  setState({
    currentDate: date,
    status: 'loading',
    errorDetails: null,
  });
}

export function setApodSuccess(apod) {
  setState({
    currentApod: apod,
    currentDate: apod.date,
    status: 'success',
    errorDetails: null,
  });
}

export function setApodError(errorMsg) {
  setState({
    status: 'error',
    errorDetails: errorMsg,
  });
}

export function setView(viewName) {
  setState({
    currentView: viewName,
  });
}
