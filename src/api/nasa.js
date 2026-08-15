/**
 * NASA APOD API client.
 *
 * All NASA API communication is centralised here.
 * The API key is read from the VITE_NASA_API_KEY environment variable
 * which Vite inlines at build time.
 *
 * API reference: https://api.nasa.gov/
 * Full docs:     https://github.com/nasa/apod-api
 *
 * Query parameters:
 *   date       (YYYY-MM-DD)  — specific date (default: today)
 *   start_date (YYYY-MM-DD)  — range start (cannot be used with `date`)
 *   end_date   (YYYY-MM-DD)  — range end (default: today)
 *   count      (int)         — return N random APODs (cannot be used with date/range)
 *   thumbs     (bool)        — return video thumbnail URL
 *   api_key    (string)      — API key (default: DEMO_KEY)
 *
 * Rate limits:
 *   Real key:  1,000 requests / hour
 *   DEMO_KEY:  30 requests / hour / IP, 50 / day / IP
 *   Headers:   X-RateLimit-Limit, X-RateLimit-Remaining
 */

import { getCachedApod, setCachedApod } from './cache.js';

const BASE_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';

// NASA APOD archive starts on 1995-06-16
export const APOD_START_DATE = '1995-06-16';

let currentAbortController = null;

/**
 * Build URL with query parameters.
 */
function buildUrl(params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set('api_key', API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Execute a fetch and handle HTTP / network errors uniformly.
 * Always requests thumbs=true so video APODs include a thumbnail_url.
 */
async function request(params = {}, signal) {
  // Always request video thumbnails
  params.thumbs = true;

  const url = buildUrl(params);
  let res;

  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw e; // Let aborts bubble up silently
    }
    throw new Error('Network error — please check your internet connection.');
  }

  if (!res.ok) {
    // Check rate-limit headers for a better message
    const remaining = res.headers.get('X-RateLimit-Remaining');
    if (res.status === 429 || remaining === '0') {
      throw new Error(
        'Rate limit exceeded — you\'ve used all available requests. '
        + 'Please wait an hour or use a personal API key.'
      );
    }
    if (res.status === 403) throw new Error('Invalid or missing NASA API key.');
    if (res.status >= 500) throw new Error('NASA servers are temporarily unavailable. Please try again later.');
    
    // Attempt to extract the API error message, but sanitize it
    try {
      const body = await res.json();
      const msg = body?.msg || body?.error?.message;
      if (msg && !msg.toLowerCase().includes('syntaxerror')) {
        throw new Error(msg);
      }
    } catch (e) {
      // Fallback
    }
    throw new Error('We could not retrieve the astronomy picture for this date.');
  }

  try {
    return await res.json();
  } catch {
    throw new Error('We received an invalid response from NASA. Please try another date.');
  }
}

/**
 * Validate the minimum shape of an APOD record.
 * NASA sometimes returns sparse data; this prevents downstream crashes.
 */
export function validateApod(data) {
  if (!data || typeof data !== 'object') return null;
  if (!data.title || !data.date) return null;
  return {
    title: data.title,
    date: data.date,
    explanation: data.explanation || '',
    url: data.url || '',
    hdurl: data.hdurl || '',
    media_type: data.media_type || 'image',
    copyright: data.copyright || '',
    thumbnail_url: data.thumbnail_url || '',
  };
}

/**
 * Fetch APOD for a specific date (YYYY-MM-DD) or today if omitted.
 */
export async function fetchApod(date) {
  // 1. Check cache first
  if (date) {
    const cached = getCachedApod(date);
    if (cached) return cached;
  }

  // 2. Cancel previous request if any
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  const params = {};
  if (date) params.date = date;

  try {
    const raw = await request(params, currentAbortController.signal);
    const apod = validateApod(raw);
    if (!apod) throw new Error('The API returned an unexpected response format.');
    
    // 3. Update cache
    if (apod.date) {
      setCachedApod(apod.date, apod);
    }
    
    return apod;
  } catch (e) {
    if (e.name === 'AbortError') throw e; // Handle gracefully in UI
    throw e;
  }
}

/**
 * Fetch a random APOD.
 */
export async function fetchRandomApod() {
  // Cannot cache random easily without storing it by the date it returns
  
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  const params = { count: 1 };
  
  try {
    const raw = await request(params, currentAbortController.signal);
    const list = Array.isArray(raw) ? raw : [raw];
    const apod = validateApod(list[0]);
    if (!apod) throw new Error('The API returned an unexpected response format.');
    
    if (apod.date) {
      setCachedApod(apod.date, apod);
    }
    
    return apod;
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw e;
  }
}

/**
 * Fetch multiple APODs for Explorer or Dashboard grids.
 * Can take { count: 20 } or { start_date, end_date }
 */
export async function fetchMultipleApods(params) {
  // Use a separate abort controller for bulk requests so they don't cancel
  // or get cancelled by the main single APOD requests immediately.
  const bulkAbortController = new AbortController();
  
  try {
    const raw = await request(params, bulkAbortController.signal);
    const list = Array.isArray(raw) ? raw : [raw];
    
    const validApods = list.map(validateApod).filter(Boolean);
    
    // Cache them as we get them
    validApods.forEach(apod => {
      if (apod.date) setCachedApod(apod.date, apod);
    });
    
    return validApods;
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw e;
  }
}
