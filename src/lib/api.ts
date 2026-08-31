import { Capacitor, CapacitorHttp } from '@capacitor/core';

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

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const isNative =
    typeof window !== 'undefined' &&
    (Capacitor.isNativePlatform() ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '4028'));

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (isNative) {
    const endpoints = [
      `http://localhost:4029${cleanPath}`,
      `http://192.168.1.14:4029${cleanPath}`,
      `http://10.0.2.2:4029${cleanPath}`,
      `http://10.35.87.141:4029${cleanPath}`
    ];

    const method = (options?.method || 'GET').toUpperCase();
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
          const bodyString = typeof nativeRes.data === 'string' ? nativeRes.data : JSON.stringify(nativeRes.data);
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

  return fetch(cleanPath, options);
}
