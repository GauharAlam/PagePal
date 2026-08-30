export const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

/**
 * Standard API fetch wrapper with JSON error handling and timeout
 */
export async function apiRequest(endpoint, options = {}, token = null) {
  const url = `${PROXY_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 35000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text();
      data = { rawText: text };
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Server returned ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      err.upgrade = data?.upgrade;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      const netErr = new Error(`Cannot connect to PagePal proxy server at ${PROXY_URL}. Please ensure the server is running.`);
      netErr.isNetwork = true;
      throw netErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
