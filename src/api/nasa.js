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

const BASE_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';

// NASA APOD archive starts on 1995-06-16
export const APOD_START_DATE = '1995-06-16';

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
async function request(params = {}) {
  // Always request video thumbnails
  params.thumbs = true;

  const url = buildUrl(params);
  let res;

  try {
    res = await fetch(url);
  } catch {
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
    // Attempt to extract the API error message
    try {
      const body = await res.json();
      throw new Error(body?.msg || body?.error?.message || `API error (${res.status})`);
    } catch (e) {
      if (e.message) throw e;
      throw new Error(`Unexpected API error (${res.status})`);
    }
  }

  try {
    return await res.json();
  } catch {
    throw new Error('Failed to parse the API response.');
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
  const params = {};
  if (date) params.date = date;
  const raw = await request(params);
  const apod = validateApod(raw);
  if (!apod) throw new Error('The API returned an unexpected response format.');
  return apod;
}

/**
 * Fetch a random APOD.
 */
export async function fetchRandomApod() {
  const params = { count: 1 };
  const raw = await request(params);
  const list = Array.isArray(raw) ? raw : [raw];
  const apod = validateApod(list[0]);
  if (!apod) throw new Error('The API returned an unexpected response format.');
  return apod;
}
