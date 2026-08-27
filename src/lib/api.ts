import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * High-Speed In-Memory & Session Cache for Instant UI Rendering
 */
interface CacheEntry {
  data: string;
  status: number;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<Response>>();
const DEFAULT_CACHE_TTL_MS = 30_000; // 30 seconds fresh cache

/**
 * Clears the API cache (call after mutations like POST, PUT, DELETE)
 */
export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Cross-platform API URL resolver for Web & Mobile (Capacitor)
 */
export function getApiUrl(path: string, host = 'localhost'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    const isCapacitor =
      Capacitor.isNativePlatform() ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '4028');

    if (isCapacitor) {
      return `http://${host}:4029${cleanPath}`;
    }
  }

  return cleanPath;
}

/**
 * Accelerated API Fetch with Request Deduplication and SWR In-Memory Caching
 */
export async function apiFetch(
  path: string,
  options?: RequestInit & { ttlMs?: number; skipCache?: boolean }
): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const isGet = method === 'GET';
  const ttl = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const skipCache = options?.skipCache ?? false;

  // Invalidate cache on write operations
  if (!isGet) {
    invalidateApiCache(cleanPath.split('?')[0]);
  }

  // Check In-Memory Cache for fast instant render
  if (isGet && !skipCache && memoryCache.has(cleanPath)) {
    const cached = memoryCache.get(cleanPath)!;
    const isFresh = Date.now() - cached.timestamp < ttl;
    if (isFresh) {
      return new Response(cached.data, {
        status: cached.status,
        headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'true' },
      });
    }
  }

  // Deduplicate concurrent simultaneous requests to prevent network stampedes
  if (isGet && inFlightRequests.has(cleanPath)) {
    const existing = inFlightRequests.get(cleanPath)!;
    const cloned = (await existing).clone();
    return cloned;
  }

  const isNative =
    typeof window !== 'undefined' &&
    (Capacitor.isNativePlatform() ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '4028'));

  const executeFetch = async (): Promise<Response> => {
    if (isNative) {
      const endpoints = [
        `http://localhost:4029${cleanPath}`,
        `http://192.168.1.14:4029${cleanPath}`,
        `http://10.0.2.2:4029${cleanPath}`,
        `http://10.35.87.141:4029${cleanPath}`,
      ];

      let bodyData: any = options?.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (e) {
          // keep string
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      for (const url of endpoints) {
        try {
          const nativeRes = await CapacitorHttp.request({
            url,
            method,
            data: bodyData,
            headers,
            connectTimeout: 2500,
            readTimeout: 2500,
          });

          if (nativeRes.status >= 200 && nativeRes.status < 500) {
            const bodyString =
              typeof nativeRes.data === 'string'
                ? nativeRes.data
                : JSON.stringify(nativeRes.data);

            if (isGet && nativeRes.status === 200) {
              memoryCache.set(cleanPath, {
                data: bodyString,
                status: nativeRes.status,
                timestamp: Date.now(),
              });
            }

            return new Response(bodyString, {
              status: nativeRes.status,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (e) {
          // try next endpoint
        }
      }
    }

    const res = await fetch(cleanPath, options);
    if (isGet && res.ok) {
      try {
        const cloned = res.clone();
        const text = await cloned.text();
        memoryCache.set(cleanPath, {
          data: text,
          status: res.status,
          timestamp: Date.now(),
        });
      } catch (e) {
        // ignore clone error
      }
    }
    return res;
  };

  if (isGet) {
    const promise = executeFetch().finally(() => {
      inFlightRequests.delete(cleanPath);
    });
    inFlightRequests.set(cleanPath, promise);
    return promise;
  }

  return executeFetch();
}
