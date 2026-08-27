import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { INITIAL_LISTINGS, INITIAL_ORDERS } from './initialData';

/**
 * In-Memory & LocalStorage Universal Data Fallback Layer
 */
interface CacheEntry {
  data: string;
  status: number;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<Response>>();
const DEFAULT_CACHE_TTL_MS = 15_000;

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
 * Universal Client-Side Storage Initializer for Static / Production GitHub Pages
 */
function getClientStorageListings() {
  if (typeof window === 'undefined') return INITIAL_LISTINGS;
  try {
    const raw = localStorage.getItem('agrimart_listings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem('agrimart_listings', JSON.stringify(INITIAL_LISTINGS));
  } catch (e) {}
  return INITIAL_LISTINGS;
}

function getClientStorageOrders() {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem('agrimart_orders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem('agrimart_orders', JSON.stringify(INITIAL_ORDERS));
  } catch (e) {}
  return INITIAL_ORDERS;
}

/**
 * Intelligent Client-Side Mock Handler for Static Hosting Environments (e.g. GitHub Pages)
 */
async function handleStaticClientFallback(path: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  let bodyData: any = {};
  if (options?.body) {
    try {
      bodyData = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {
      bodyData = {};
    }
  }

  // 1. Auth: Login
  if (path.includes('/api/auth/login')) {
    const phone = bodyData.phone || '9876543210';
    const role =
      phone === '9823456780' || phone.includes('retailer')
        ? 'retailer'
        : phone === '9811223344' || phone.includes('logistics')
        ? 'logistics'
        : phone === '9899001122' || phone.includes('admin')
        ? 'admin'
        : 'farmer';

    const user = {
      phone,
      name: bodyData.name || (role === 'retailer' ? 'Priya Retail Hub' : role === 'logistics' ? 'Nashik Coop Logistics' : 'Ramesh Kumar'),
      role,
      state: 'Maharashtra',
      language: 'en',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('agrimart_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('agrimart_user_update', { detail: user }));
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Auth: Register
  if (path.includes('/api/auth/register')) {
    const user = {
      phone: bodyData.phone || '9876543210',
      name: bodyData.name || 'AgriMart Member',
      role: (bodyData.role || 'farmer').toLowerCase(),
      state: bodyData.state || 'Maharashtra',
      language: bodyData.language || 'en',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('agrimart_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('agrimart_user_update', { detail: user }));
    }

    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Auth: Profile Update
  if (path.includes('/api/auth/profile')) {
    const currentUserRaw = typeof window !== 'undefined' ? localStorage.getItem('agrimart_user') : null;
    let user = currentUserRaw ? JSON.parse(currentUserRaw) : { phone: '9876543210', name: 'Ramesh Kumar', role: 'farmer' };
    user = { ...user, ...bodyData, updatedAt: Date.now() };

    if (typeof window !== 'undefined') {
      localStorage.setItem('agrimart_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('agrimart_user_update', { detail: user }));
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Produce Listings
  if (path.includes('/api/listings')) {
    const currentListings = getClientStorageListings();

    if (method === 'GET') {
      return new Response(JSON.stringify(currentListings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const newListing = {
        id: `listing-${Date.now()}`,
        status: 'active',
        listedAt: Date.now(),
        farmerRating: 4.9,
        farmerOrders: 18,
        ...bodyData,
      };

      const updated = [newListing, ...currentListings];
      if (typeof window !== 'undefined') {
        localStorage.setItem('agrimart_listings', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('agrimart_listings_update', { detail: updated }));
      }

      return new Response(JSON.stringify(newListing), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      const listingId = path.split('/').pop();
      const updated = currentListings.filter((l: any) => l.id !== listingId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agrimart_listings', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('agrimart_listings_update', { detail: updated }));
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 5. Orders Management
  if (path.includes('/api/orders')) {
    const currentOrders = getClientStorageOrders();

    if (method === 'GET') {
      return new Response(JSON.stringify(currentOrders), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const newOrder = {
        id: `ord-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'pending',
        hasBlockchain: true,
        ...bodyData,
      };

      const updated = [newOrder, ...currentOrders];
      if (typeof window !== 'undefined') {
        localStorage.setItem('agrimart_orders', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('agrimart_orders_update', { detail: updated }));
      }

      return new Response(JSON.stringify(newOrder), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const { orderId, status } = bodyData;
      const updated = currentOrders.map((o: any) => (o.id === orderId ? { ...o, status } : o));
      if (typeof window !== 'undefined') {
        localStorage.setItem('agrimart_orders', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('agrimart_orders_update', { detail: updated }));
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 6. AI Voice Assistant
  if (path.includes('/api/ai/voice-assistant')) {
    const userQuery = (bodyData.message || '').toLowerCase();
    const lang = bodyData.language || 'en';

    let aiResponse = 'I have processed your agricultural request. Market conditions and price trends for your crop look very favorable.';

    if (userQuery.includes('tomato') || userQuery.includes('टमाटर') || userQuery.includes('टोमॅटो')) {
      aiResponse =
        lang === 'hi'
          ? 'आज नाशिक एपीएमसी में ग्रेड ए टमाटर ₹28 से ₹32 प्रति किलो पर बिक रहा है। मांग 18% अधिक है।'
          : lang === 'mr'
          ? 'आज नाशिक एपीएमसीमध्ये ग्रेड ए टोमॅटो ₹28 ते ₹32 प्रति किलोने विकला जात आहे. मागणी 18% जास्त आहे.'
          : 'Today, Grade A Tomato in Nashik APMC is trading between ₹28 and ₹32 per kg with high buyer demand.';
    } else if (userQuery.includes('onion') || userQuery.includes('प्याज') || userQuery.includes('कांदा')) {
      aiResponse =
        lang === 'hi'
          ? 'लासलगांव मंडी में लाल प्याज का आज का भाव ₹24 प्रति किलो है। स्थिरता बनी हुई है।'
          : lang === 'mr'
          ? 'लासलगाव मार्केटमध्ये लाल कांद्याचा भाव ₹24 प्रति किलो आहे.'
          : 'Lasalgaon Mandi onion prices are steady at ₹24 per kg today.';
    } else if (userQuery.includes('weather') || userQuery.includes('rain') || userQuery.includes('बारिश') || userQuery.includes('पाऊस')) {
      aiResponse =
        lang === 'hi'
          ? 'नाशिक क्षेत्र में अगले 5 दिनों में हल्की वर्षा की संभावना है। फसल की सुरक्षा सुनिश्चित करें।'
          : lang === 'mr'
          ? 'नाशिक विभागात पुढील 5 दिवसांत हलका पाऊस पडण्याची शक्यता आहे.'
          : 'Weather alert: Light rainfall is expected in the Nashik region over the next 5 days. Ensure cold storage protections.';
    } else if (userQuery.includes('order') || userQuery.includes('ऑर्डर')) {
      aiResponse =
        lang === 'hi'
          ? 'आपके पास 2 सक्रिय ऑर्डर हैं। ऑर्डर #ord-801 प्रेषित कर दिया गया है।'
          : lang === 'mr'
          ? 'तुमच्याकडे 2 सक्रिय ऑर्डर्स आहेत. ऑर्डर #ord-801 डिस्पॅच झाली आहे.'
          : 'You have 2 active orders. Order #ord-801 has been dispatched with GPS cold-chain tracking.';
    } else if (userQuery.includes('credit') || userQuery.includes('loan') || userQuery.includes('लोन')) {
      aiResponse =
        lang === 'hi'
          ? 'आपकी वर्तमान किसान क्रेडिट सीमा ₹1,50,000 है। ब्याज दर 4.5% प्रति वर्ष है।'
          : lang === 'mr'
          ? 'तुमची किसान क्रेडिट मर्यादा ₹1,50,000 आहे.'
          : 'Your Kisan Instant Micro-Credit limit is approved for ₹1,50,000 at 4.5% annual subsidized interest.';
    }

    return new Response(
      JSON.stringify({
        aiResponse,
        conversationId: bodyData.conversationId || 'conv-001',
        action: 'voice_response',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generic fallback
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Cross-Platform API Fetch with Automatic Backend Detection and Seamless Static Fallback
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

  if (!isGet) {
    invalidateApiCache(cleanPath.split('?')[0]);
  }

  // Check In-Memory Cache for fast UI responsiveness
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

  // Deduplicate concurrent simultaneous requests
  if (isGet && inFlightRequests.has(cleanPath)) {
    const existing = inFlightRequests.get(cleanPath)!;
    return (await existing).clone();
  }

  const isNative =
    typeof window !== 'undefined' &&
    (Capacitor.isNativePlatform() ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '4028'));

  const executeFetch = async (): Promise<Response> => {
    // Mobile Capacitor Native Handling
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
        } catch (e) {}
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      for (const url of endpoints) {
        try {
          const nativeRes = await CapacitorHttp.request({
            url,
            method,
            data: bodyData,
            headers,
            connectTimeout: 2000,
            readTimeout: 2000,
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
        } catch (e) {}
      }
    }

    // Web Standard Fetch
    try {
      const res = await fetch(cleanPath, options);

      // Check if the response is valid JSON from an active API server
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (res.ok && isJson) {
        if (isGet) {
          try {
            const cloned = res.clone();
            const text = await cloned.text();
            memoryCache.set(cleanPath, {
              data: text,
              status: res.status,
              timestamp: Date.now(),
            });
          } catch (e) {}
        }
        return res;
      }
    } catch (networkError) {
      // Backend is offline (e.g. static hosting on GitHub Pages)
    }

    // Fallback to client-side storage & Firestore simulation for static deployments
    const fallbackResponse = await handleStaticClientFallback(cleanPath, options);
    if (isGet && fallbackResponse.ok) {
      try {
        const cloned = fallbackResponse.clone();
        const text = await cloned.text();
        memoryCache.set(cleanPath, {
          data: text,
          status: fallbackResponse.status,
          timestamp: Date.now(),
        });
      } catch (e) {}
    }
    return fallbackResponse;
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
