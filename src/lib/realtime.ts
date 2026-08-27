import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  orderBy,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { INITIAL_LISTINGS } from './initialData';

export interface ListingItem {
  id: string;
  cropType: string;
  variety: string;
  farmName: string;
  farmerName: string;
  region: string;
  state: string;
  grade: string;
  qualityScore: number;
  quantityKg: number;
  pricePerKg: number;
  harvestDate: string;
  availableUntil: string;
  freshnessScore: number;
  status: string;
  isCooperative: boolean;
  hasBlockchain: boolean;
  isFlashSale: boolean;
  imageUrl: string;
  imageAlt?: string;
  minOrderKg?: number;
  farmerRating?: number;
  farmerOrders?: number;
  listedAt?: number;
  isBuyRequest?: boolean;
  sellerPhone?: string;
  certifications?: string[];
  views?: number;
  bids?: number;
}

export interface OrderItem {
  id: string;
  crop: string;
  qty: number;
  partner: string;
  location: string;
  totalVal: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  date: string;
  hasBlockchain: boolean;
  buyerPhone: string;
  sellerPhone: string;
  createdAt?: any;
}

// Global In-Memory Caches for Instant (0ms) Screen Navigation
let cachedRawListings: ListingItem[] | null = null;
let cachedRawOrders: OrderItem[] | null = null;

// Multiplexed Listeners & Subscriber Sets
type ListingSubscriber = {
  filters: { isBuyRequest?: boolean; flashOnly?: boolean; farmerPhone?: string };
  onData: (data: ListingItem[]) => void;
  onError?: (err: Error) => void;
};
const listingSubscribers = new Set<ListingSubscriber>();
let rawListingsUnsub: Unsubscribe | null = null;

type OrderSubscriber = {
  phone: string;
  role: string;
  onData: (data: OrderItem[]) => void;
  onError?: (err: Error) => void;
};
const orderSubscribers = new Set<OrderSubscriber>();
let rawOrdersUnsub: Unsubscribe | null = null;

function filterAndSortListings(items: ListingItem[], filters: ListingSubscriber['filters']): ListingItem[] {
  let filtered = items;
  if (filters.isBuyRequest !== undefined) {
    filtered = filtered.filter((i) => Boolean(i.isBuyRequest) === filters.isBuyRequest);
  }
  if (filters.flashOnly) {
    filtered = filtered.filter((i) => Boolean(i.isFlashSale));
  }
  if (filters.farmerPhone) {
    filtered = filtered.filter((i) => i.sellerPhone === filters.farmerPhone);
  }
  return filtered;
}

function filterAndSortOrders(items: OrderItem[], phone: string, role: string): OrderItem[] {
  let filtered = items;
  if (role === 'retailer') {
    filtered = items.filter((o) => o.buyerPhone === phone || o.buyerPhone === '9823456780');
  } else if (role === 'logistics') {
    filtered = items;
  } else {
    filtered = items.filter((o) => o.sellerPhone === phone || o.sellerPhone === '9876543210');
  }
  return filtered;
}

function notifyListingSubscribers() {
  if (!cachedRawListings) return;
  for (const sub of listingSubscribers) {
    try {
      const data = filterAndSortListings(cachedRawListings, sub.filters);
      sub.onData(data);
    } catch (e) {
      console.warn('Error notifying listing subscriber:', e);
    }
  }
}

function notifyOrderSubscribers() {
  if (!cachedRawOrders) return;
  for (const sub of orderSubscribers) {
    try {
      const data = filterAndSortOrders(cachedRawOrders, sub.phone, sub.role);
      sub.onData(data);
    } catch (e) {
      console.warn('Error notifying order subscriber:', e);
    }
  }
}

function initRawListingsListener() {
  if (rawListingsUnsub || typeof window === 'undefined') return;
  try {
    const listingsRef = collection(db, 'listings');
    rawListingsUnsub = onSnapshot(
      listingsRef,
      (snapshot) => {
        if (snapshot.empty && INITIAL_LISTINGS.length > 0) {
          cachedRawListings = INITIAL_LISTINGS as ListingItem[];
        } else {
          const items: ListingItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ListingItem;
            items.push({
              ...data,
              id: docSnap.id || data.id,
              isCooperative: Boolean(data.isCooperative),
              hasBlockchain: Boolean(data.hasBlockchain),
              isFlashSale: Boolean(data.isFlashSale),
              isBuyRequest: Boolean(data.isBuyRequest),
              certifications: data.cropType === 'Tomato' ? ['APEDA', 'Organic India'] : (data.certifications || ['FSSAI Certified']),
            });
          });
          items.sort((a, b) => (b.listedAt || 0) - (a.listedAt || 0));
          cachedRawListings = items;
        }
        notifyListingSubscribers();
      },
      (error) => {
        console.warn('Real-time Firestore listings subscription warning:', error);
        for (const sub of listingSubscribers) {
          if (sub.onError) sub.onError(error);
        }
      }
    );
  } catch (err: any) {
    console.error('Failed to initialize shared listings listener:', err);
  }
}

function initRawOrdersListener() {
  if (rawOrdersUnsub || typeof window === 'undefined') return;
  try {
    const ordersRef = collection(db, 'orders');
    rawOrdersUnsub = onSnapshot(
      ordersRef,
      (snapshot) => {
        const items: OrderItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as OrderItem;
          items.push({
            ...data,
            id: docSnap.id || data.id,
            hasBlockchain: Boolean(data.hasBlockchain),
          });
        });
        items.sort((a, b) => {
          const dateA = a.date ? Date.parse(a.date) : 0;
          const dateB = b.date ? Date.parse(b.date) : 0;
          return dateB - dateA;
        });
        cachedRawOrders = items;
        notifyOrderSubscribers();
      },
      (error) => {
        console.warn('Real-time Firestore orders subscription warning:', error);
        for (const sub of orderSubscribers) {
          if (sub.onError) sub.onError(error);
        }
      }
    );
  } catch (err: any) {
    console.error('Failed to initialize shared orders listener:', err);
  }
}

/**
 * Subscribe to listings in real-time with instant synchronous cache hydration.
 */
export function subscribeToListings(
  filters: {
    isBuyRequest?: boolean;
    flashOnly?: boolean;
    farmerPhone?: string;
  },
  onData: (listings: ListingItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const sub: ListingSubscriber = { filters, onData, onError };
  listingSubscribers.add(sub);

  // 1. Instant Cache Hydration: If cached data exists or fallback is available, dispatch immediately (0ms)
  if (cachedRawListings) {
    try {
      onData(filterAndSortListings(cachedRawListings, filters));
    } catch (e) {}
  } else if (INITIAL_LISTINGS.length > 0) {
    const fallback = INITIAL_LISTINGS.filter((l) => {
      if (filters.isBuyRequest !== undefined) return Boolean(l.isBuyRequest) === filters.isBuyRequest;
      if (filters.flashOnly) return Boolean(l.isFlashSale);
      return true;
    });
    try {
      onData(fallback as ListingItem[]);
    } catch (e) {}
  }

  // 2. Ensure singleton listener is running
  initRawListingsListener();

  return () => {
    listingSubscribers.delete(sub);
  };
}

/**
 * Subscribe to Orders in real-time with instant synchronous cache hydration.
 */
export function subscribeToOrders(
  phone: string,
  role: string,
  onData: (orders: OrderItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const sub: OrderSubscriber = { phone, role, onData, onError };
  orderSubscribers.add(sub);

  // 1. Instant Cache Hydration: If cached data exists, dispatch immediately (0ms)
  if (cachedRawOrders) {
    try {
      onData(filterAndSortOrders(cachedRawOrders, phone, role));
    } catch (e) {}
  }

  // 2. Ensure singleton listener is running
  initRawOrdersListener();

  return () => {
    orderSubscribers.delete(sub);
  };
}

/**
 * Real-time Delete Listing directly via Firestore
 */
export async function deleteListingRealtime(listingId: string): Promise<void> {
  // Optimistic Cache update
  if (cachedRawListings) {
    cachedRawListings = cachedRawListings.filter((l) => l.id !== listingId);
    notifyListingSubscribers();
  }
  try {
    const docRef = doc(db, 'listings', listingId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Direct Firestore delete error, falling back to API:', e);
    await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
  }
}

/**
 * Real-time Update Listing Status directly via Firestore
 */
export async function updateListingStatusRealtime(
  listingId: string,
  newStatus: string
): Promise<void> {
  // Optimistic Cache update
  if (cachedRawListings) {
    cachedRawListings = cachedRawListings.map((l) =>
      l.id === listingId ? { ...l, status: newStatus } : l
    );
    notifyListingSubscribers();
  }
  try {
    const docRef = doc(db, 'listings', listingId);
    await updateDoc(docRef, { status: newStatus });
  } catch (e) {
    console.error('Direct Firestore update error:', e);
  }
}

/**
 * Real-time Update Order Status directly via Firestore
 */
export async function updateOrderStatusRealtime(
  orderId: string,
  newStatus: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
): Promise<void> {
  // Optimistic Cache update
  if (cachedRawOrders) {
    cachedRawOrders = cachedRawOrders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    notifyOrderSubscribers();
  }
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status: newStatus });
  } catch (e) {
    console.error('Direct Firestore order update error:', e);
  }
}

export interface UserProfile {
  phone: string;
  name: string;
  email?: string | null;
  role: 'farmer' | 'retailer' | 'logistics' | 'admin';
  state: string;
  region?: string;
  farmName?: string;
  language: string;
  profileImage?: string;
  updatedAt?: number;
}

/**
 * Subscribe to User Profile changes in real-time with instant local cache hydration
 */
export function subscribeToUserProfile(
  phone: string,
  onData: (user: UserProfile) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (typeof window === 'undefined' || !phone) return () => {};

  // 1. Instant Cache Hydration from localStorage
  const stored = localStorage.getItem('agrimart_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.phone === phone || !phone) {
        onData(parsed);
      }
    } catch (e) {}
  }

  // 2. Real-time Firestore document listener
  try {
    const userDocRef = doc(db, 'users', phone);
    const unsub = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          const current = localStorage.getItem('agrimart_user');
          let merged = data;
          if (current) {
            try {
              merged = { ...JSON.parse(current), ...data };
            } catch (e) {}
          }
          localStorage.setItem('agrimart_user', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('agrimart_user_update', { detail: merged }));
          onData(merged);
        }
      },
      (error) => {
        console.warn('Real-time Firestore user profile warning:', error);
        if (onError) onError(error);
      }
    );
    return unsub;
  } catch (err: any) {
    console.error('Failed to subscribe to user profile:', err);
    return () => {};
  }
}

/**
 * Update User Profile with immediate optimistic sync across tabs & Firestore
 */
export async function updateUserProfileRealtime(
  phone: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const current = localStorage.getItem('agrimart_user');
  let user: any = { phone, ...updates };
  if (current) {
    try {
      user = { ...JSON.parse(current), ...updates, updatedAt: Date.now() };
    } catch (e) {}
  }
  localStorage.setItem('agrimart_user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('agrimart_user_update', { detail: user }));

  try {
    const userDocRef = doc(db, 'users', phone);
    await setDoc(userDocRef, { ...user, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.warn('Direct Firestore user update error:', e);
  }
}

