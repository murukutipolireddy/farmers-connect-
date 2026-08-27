import sqliteDb from './db';
import { getAdminDb } from './firebaseAdmin';
import { seedFirestore } from './seedFirestore';

// Helper to check if Firebase Admin credentials are configured
export function isFirebaseConfigured(): boolean {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  const hasServiceAccountKey = serviceAccountKey && !serviceAccountKey.includes("YOUR_PRIVATE_KEY_HERE");
  const hasIndividualKeys = privateKey && clientEmail && !privateKey.includes("YOUR_PRIVATE_KEY_HERE");
  
  return Boolean(hasServiceAccountKey || hasIndividualKeys);
}

// Log connection status
if (isFirebaseConfigured()) {
  console.log('🔥 Agrimart Database Adapter: Connected to Cloud Firestore.');
  // Run seeding asynchronously
  seedFirestore().catch(console.error);
} else {
  console.log('💾 Agrimart Database Adapter: Firebase keys missing/placeholder. Falling back to offline SQLite database.');
}

export async function getUserByPhoneOrEmail(phoneOrEmail: string): Promise<any> {
  const isEmail = phoneOrEmail.includes('@');
  
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    if (isEmail) {
      const snap = await db.collection('users').where('email', '==', phoneOrEmail).limit(1).get();
      return snap.empty ? null : snap.docs[0].data();
    } else {
      const doc = await db.collection('users').doc(phoneOrEmail).get();
      return doc.exists ? doc.data() : null;
    }
  } else {
    if (isEmail) {
      return sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(phoneOrEmail);
    } else {
      return sqliteDb.prepare('SELECT * FROM users WHERE phone = ?').get(phoneOrEmail);
    }
  }
}

export async function createUser(user: {
  phone: string;
  email: string | null;
  name: string;
  password: string;
  role: string;
  state: string;
  language: string;
}): Promise<any> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    await db.collection('users').doc(user.phone).set(user);
    return user;
  } else {
    const insert = sqliteDb.prepare(`
      INSERT INTO users (phone, email, name, password, role, state, language)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(user.phone, user.email, user.name, user.password, user.role, user.state, user.language);
    return user;
  }
}

export async function getUserByCredentials(phoneOrEmail: string, password?: string): Promise<any> {
  const isEmail = phoneOrEmail.includes('@');
  
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    if (isEmail) {
      const q = db.collection('users').where('email', '==', phoneOrEmail);
      const snap = password ? await q.where('password', '==', password).limit(1).get() : await q.limit(1).get();
      return snap.empty ? null : snap.docs[0].data();
    } else {
      const doc = await db.collection('users').doc(phoneOrEmail).get();
      if (doc.exists) {
        const u = doc.data();
        if (!password || (u && u.password === password)) {
          return u;
        }
      }
      return null;
    }
  } else {
    if (isEmail) {
      return password 
        ? sqliteDb.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(phoneOrEmail, password)
        : sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(phoneOrEmail);
    } else {
      return password 
        ? sqliteDb.prepare('SELECT * FROM users WHERE phone = ? AND password = ?').get(phoneOrEmail, password)
        : sqliteDb.prepare('SELECT * FROM users WHERE phone = ?').get(phoneOrEmail);
    }
  }
}

export async function getListings(filters: {
  crop?: string | null;
  grade?: string | null;
  region?: string | null;
  flash?: string | null;
  isBuyRequest?: string | null;
}): Promise<any[]> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const snap = await db.collection('listings').get();
    let list = snap.docs.map((doc: any) => doc.data()) as any[];

    if (filters.crop) {
      list = list.filter((l) => l.cropType?.toLowerCase() === filters.crop?.toLowerCase());
    }
    if (filters.grade) {
      list = list.filter((l) => l.grade?.toLowerCase() === filters.grade?.toLowerCase());
    }
    if (filters.region) {
      list = list.filter((l) => l.region?.toLowerCase() === filters.region?.toLowerCase());
    }
    if (filters.flash === 'true') {
      list = list.filter((l) => l.isFlashSale === true);
    }
    if (filters.isBuyRequest === '1') {
      list = list.filter((l) => l.isBuyRequest === true);
    } else {
      list = list.filter((l) => l.isBuyRequest === false || !l.isBuyRequest);
    }

    list.sort((a, b) => (b.listedAt || 0) - (a.listedAt || 0));
    return list;
  } else {
    let query = 'SELECT * FROM listings';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.crop) {
      conditions.push('cropType = ?');
      params.push(filters.crop);
    }
    if (filters.grade) {
      conditions.push('grade = ?');
      params.push(filters.grade);
    }
    if (filters.region) {
      conditions.push('region = ?');
      params.push(filters.region);
    }
    if (filters.flash === 'true') {
      conditions.push('isFlashSale = 1');
    }
    if (filters.isBuyRequest === '1') {
      conditions.push('isBuyRequest = 1');
    } else {
      conditions.push('isBuyRequest = 0');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY listedAt DESC';

    const list = sqliteDb.prepare(query).all(...params) as any[];
    return list.map((l) => ({
      ...l,
      isCooperative: Boolean(l.isCooperative),
      hasBlockchain: Boolean(l.hasBlockchain),
      isFlashSale: Boolean(l.isFlashSale)
    }));
  }
}

export async function createListing(listing: any): Promise<any> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    await db.collection('listings').doc(listing.id).set(listing);
    return listing;
  } else {
    const insert = sqliteDb.prepare(`
      INSERT INTO listings (
        id, cropType, variety, farmName, farmerName, region, state, grade,
        qualityScore, quantityKg, pricePerKg, harvestDate, availableUntil,
        freshnessScore, status, isCooperative, hasBlockchain, isFlashSale,
        imageUrl, imageAlt, minOrderKg, farmerRating, farmerOrders, listedAt, isBuyRequest
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    insert.run(
      listing.id,
      listing.cropType,
      listing.variety,
      listing.farmName,
      listing.farmerName,
      listing.region,
      listing.state,
      listing.grade,
      listing.qualityScore,
      listing.quantityKg,
      listing.pricePerKg,
      listing.harvestDate,
      listing.availableUntil,
      listing.freshnessScore,
      listing.status,
      listing.isCooperative ? 1 : 0,
      listing.hasBlockchain ? 1 : 0,
      listing.isFlashSale ? 1 : 0,
      listing.imageUrl,
      listing.imageAlt,
      listing.minOrderKg,
      listing.farmerRating,
      listing.farmerOrders,
      listing.listedAt,
      listing.isBuyRequest ? 1 : 0
    );
    return listing;
  }
}

export async function getOrders(phone: string, role: string): Promise<any[]> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    let snap;
    if (role === 'retailer') {
      snap = await db.collection('orders').where('buyerPhone', '==', phone).get();
    } else {
      snap = await db.collection('orders').where('sellerPhone', '==', phone).get();
    }
    const list = snap.docs.map((doc: any) => doc.data()) as any[];
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });
    return list;
  } else {
    let orders;
    if (role === 'retailer') {
      orders = sqliteDb.prepare('SELECT * FROM orders WHERE buyerPhone = ? ORDER BY date DESC').all(phone) as any[];
    } else {
      orders = sqliteDb.prepare('SELECT * FROM orders WHERE sellerPhone = ? ORDER BY date DESC').all(phone) as any[];
    }
    return orders.map((o) => ({
      ...o,
      hasBlockchain: Boolean(o.hasBlockchain)
    }));
  }
}

export async function createOrderTransaction(params: {
  orderId: string;
  listingId: string;
  qty: number;
  resolvedPrice: number;
  totalVal: number;
  buyerPhoneNum: string;
  sellerPhoneNum: string;
  partnerName: string;
  locationVal: string;
}): Promise<any> {
  const {
    orderId, listingId, qty, resolvedPrice, totalVal,
    buyerPhoneNum, sellerPhoneNum, partnerName, locationVal
  } = params;

  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const listingRef = db.collection('listings').doc(listingId);
    
    await db.runTransaction(async (transaction: any) => {
      const freshDoc = await transaction.get(listingRef);
      if (!freshDoc.exists) {
        throw new Error('Listing not found');
      }
      const freshData = freshDoc.data() as any;
      if (freshData.quantityKg < qty) {
        throw new Error('Insufficient quantity available');
      }
      
      const newQty = freshData.quantityKg - qty;
      const newStatus = newQty <= 0 ? 'sold' : freshData.status;

      transaction.update(listingRef, {
        quantityKg: newQty,
        status: newStatus
      });

      const orderRef = db.collection('orders').doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        crop: `${freshData.cropType} (${freshData.grade === 'A' ? 'Grade A' : 'Grade B'}) @ ₹${resolvedPrice}/kg`,
        qty: Number(qty),
        partner: partnerName,
        location: locationVal,
        totalVal,
        status: 'pending',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        hasBlockchain: Boolean(freshData.hasBlockchain),
        buyerPhone: buyerPhoneNum,
        sellerPhone: sellerPhoneNum
      });
    });
  } else {
    // SQLite transaction
    const listing = sqliteDb.prepare('SELECT * FROM listings WHERE id = ?').get(listingId) as any;
    if (!listing) {
      throw new Error('Listing not found');
    }
    if (listing.quantityKg < qty) {
      throw new Error('Insufficient quantity available');
    }

    const transaction = sqliteDb.transaction(() => {
      const newQty = listing.quantityKg - qty;
      const newStatus = newQty <= 0 ? 'sold' : listing.status;

      sqliteDb.prepare('UPDATE listings SET quantityKg = ?, status = ? WHERE id = ?')
        .run(newQty, newStatus, listingId);

      sqliteDb.prepare(`
        INSERT INTO orders (id, crop, qty, partner, location, totalVal, status, date, hasBlockchain, buyerPhone, sellerPhone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        `${listing.cropType} (${listing.grade === 'A' ? 'Grade A' : 'Grade B'}) @ ₹${resolvedPrice}/kg`,
        Number(qty),
        partnerName,
        locationVal,
        totalVal,
        'pending',
        new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        listing.hasBlockchain ? 1 : 0,
        buyerPhoneNum,
        sellerPhoneNum
      );
    });
    transaction();
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const ref = db.collection('orders').doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) {
      return false;
    }
    await ref.update({ status });
    return true;
  } else {
    const result = sqliteDb.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    return result.changes > 0;
  }
}

export async function getListingById(id: string): Promise<any> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const doc = await db.collection('listings').doc(id).get();
    return doc.exists ? doc.data() : null;
  } else {
    return sqliteDb.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  }
}

export async function updateListing(id: string, updates: Partial<any>): Promise<boolean> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const ref = db.collection('listings').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.update(updates);
    return true;
  } else {
    const keys = Object.keys(updates);
    if (keys.length === 0) return false;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => (updates as any)[k]);
    const result = sqliteDb.prepare(`UPDATE listings SET ${setClause} WHERE id = ?`).run(...values, id);
    return result.changes > 0;
  }
}

export async function deleteListing(id: string): Promise<boolean> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const ref = db.collection('listings').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  } else {
    const result = sqliteDb.prepare('DELETE FROM listings WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export async function updateUserProfile(phone: string, updates: Record<string, any>): Promise<any> {
  if (isFirebaseConfigured()) {
    const db = getAdminDb();
    const ref = db.collection('users').doc(phone);
    const doc = await ref.get();
    const updatedData = { ...updates, updatedAt: Date.now() };
    if (!doc.exists) {
      await ref.set({ phone, ...updatedData });
    } else {
      await ref.set(updatedData, { merge: true });
    }
    const latestDoc = await ref.get();
    return latestDoc.data();
  } else {
    const existing = sqliteDb.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!existing) return null;
    const keys = Object.keys(updates);
    if (keys.length > 0) {
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = keys.map((k) => updates[k]);
      sqliteDb.prepare(`UPDATE users SET ${setClause} WHERE phone = ?`).run(...values, phone);
    }
    return sqliteDb.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  }
}

