import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

if (process.env.NODE_ENV === 'production') {
  db = new Database(path.join(process.cwd(), '..', 'agrimart_v2.db'));
} else {
  if (!(global as any).db) {
    (global as any).db = new Database(path.join(process.cwd(), '..', 'agrimart_v2.db'));
  }
  db = (global as any).db;
}

// Enable high-performance SQLite PRAGMAs
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');

// Initialize database tables & indexes
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    state TEXT,
    language TEXT
  );

  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    cropType TEXT NOT NULL,
    variety TEXT NOT NULL,
    farmName TEXT NOT NULL,
    farmerName TEXT NOT NULL,
    region TEXT NOT NULL,
    state TEXT NOT NULL,
    grade TEXT NOT NULL,
    qualityScore INTEGER NOT NULL,
    quantityKg REAL NOT NULL,
    pricePerKg REAL NOT NULL,
    harvestDate TEXT NOT NULL,
    availableUntil TEXT NOT NULL,
    freshnessScore INTEGER NOT NULL,
    status TEXT NOT NULL,
    isCooperative INTEGER NOT NULL,
    hasBlockchain INTEGER NOT NULL,
    isFlashSale INTEGER NOT NULL,
    imageUrl TEXT NOT NULL,
    imageAlt TEXT NOT NULL,
    minOrderKg REAL NOT NULL,
    farmerRating REAL NOT NULL,
    farmerOrders INTEGER NOT NULL,
    listedAt INTEGER NOT NULL,
    isBuyRequest INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    crop TEXT NOT NULL,
    qty REAL NOT NULL,
    partner TEXT NOT NULL,
    location TEXT NOT NULL,
    totalVal REAL NOT NULL,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    hasBlockchain INTEGER NOT NULL,
    buyerPhone TEXT NOT NULL,
    sellerPhone TEXT NOT NULL
  );

  -- High performance indexes for fast lookups & filtering
  CREATE INDEX IF NOT EXISTS idx_listings_crop_status ON listings(cropType, status);
  CREATE INDEX IF NOT EXISTS idx_listings_isBuyRequest ON listings(isBuyRequest);
  CREATE INDEX IF NOT EXISTS idx_listings_isFlashSale ON listings(isFlashSale);
  CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);
  CREATE INDEX IF NOT EXISTS idx_listings_listedAt ON listings(listedAt DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyerPhone);
  CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(sellerPhone);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Run migrations for existing databases that don't have the 'email' column
try {
  db.exec('ALTER TABLE users ADD COLUMN email TEXT UNIQUE');
} catch (e) {
  // Column already exists, ignore
}

// Seed default users if table is empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (phone, email, name, password, role, state, language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertUser.run('9876543210', 'ramesh@agrimart.com', 'Ramesh Kumar', 'Kisan@2026', 'farmer', 'Maharashtra', 'en');
  insertUser.run('9823456780', 'priya@agrimart.com', 'Priya Merchants', 'Retail@2026', 'retailer', 'Maharashtra', 'en');
  insertUser.run('9912345678', 'anita@agrimart.com', 'Anita Reddy', 'Admin@2026', 'admin', 'Andhra Pradesh', 'en');
}

// Seed default listings if table is empty
const listingCount = db.prepare('SELECT count(*) as count FROM listings').get() as { count: number };
if (listingCount.count === 0) {
  const insertListing = db.prepare(`
    INSERT INTO listings (
      id, cropType, variety, farmName, farmerName, region, state, grade,
      qualityScore, quantityKg, pricePerKg, harvestDate, availableUntil,
      freshnessScore, status, isCooperative, hasBlockchain, isFlashSale,
      imageUrl, imageAlt, minOrderKg, farmerRating, farmerOrders, listedAt, isBuyRequest
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const initialListings = [
    {
      id: 'listing-001',
      cropType: 'Tomato',
      variety: 'Hybrid F1 — Naveen',
      farmName: 'Ramesh Kumar Farm',
      farmerName: 'Ramesh Kumar',
      region: 'Nashik',
      state: 'Maharashtra',
      grade: 'A',
      qualityScore: 94,
      quantityKg: 2800,
      pricePerKg: 28,
      harvestDate: '03/05/2026',
      availableUntil: '12/05/2026',
      freshnessScore: 96,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1723234387588-756c4d1e3e1a',
      imageAlt: 'Fresh red tomatoes on vine in sunlight',
      minOrderKg: 100,
      farmerRating: 4.8,
      farmerOrders: 312,
      listedAt: 1746518400
    },
    {
      id: 'listing-002',
      cropType: 'Onion',
      variety: 'Nasik Red — Medium',
      farmName: 'Suresh Patel Farm',
      farmerName: 'Suresh Patel',
      region: 'Solapur',
      state: 'Maharashtra',
      grade: 'A',
      qualityScore: 91,
      quantityKg: 5200,
      pricePerKg: 22,
      harvestDate: '28/04/2026',
      availableUntil: '18/05/2026',
      freshnessScore: 88,
      status: 'active',
      isCooperative: 1,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1728363333238-1ebfd8eaf995',
      imageAlt: 'Pile of red onions with papery skin',
      minOrderKg: 500,
      farmerRating: 4.6,
      farmerOrders: 198,
      listedAt: 1746432000
    },
    {
      id: 'listing-003',
      cropType: 'Spinach',
      variety: 'Palak — All Season',
      farmName: 'Anita Reddy Organics',
      farmerName: 'Anita Reddy',
      region: 'Chittoor',
      state: 'Andhra Pradesh',
      grade: 'A',
      qualityScore: 97,
      quantityKg: 380,
      pricePerKg: 45,
      harvestDate: '05/05/2026',
      availableUntil: '08/05/2026',
      freshnessScore: 99,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_12d80f805-1773092219586.png',
      imageAlt: 'Fresh green spinach leaves in bunch',
      minOrderKg: 20,
      farmerRating: 4.9,
      farmerOrders: 87,
      listedAt: 1746604800
    },
    {
      id: 'listing-004',
      cropType: 'Potato',
      variety: 'Kufri Jyoti — Grade 1',
      farmName: 'Vikram Singh Cold Farm',
      farmerName: 'Vikram Singh',
      region: 'Agra',
      state: 'Uttar Pradesh',
      grade: 'B',
      qualityScore: 78,
      quantityKg: 12000,
      pricePerKg: 18,
      harvestDate: '15/04/2026',
      availableUntil: '30/06/2026',
      freshnessScore: 82,
      status: 'active',
      isCooperative: 1,
      hasBlockchain: 0,
      isFlashSale: 0,
      imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_1398448c4-1768159074106.png',
      imageAlt: 'Brown potatoes in burlap sack on wooden floor',
      minOrderKg: 1000,
      farmerRating: 4.4,
      farmerOrders: 445,
      listedAt: 1746345600
    },
    {
      id: 'listing-005',
      cropType: 'Cauliflower',
      variety: 'Snowball — Extra Large',
      farmName: 'Gurmeet Kaur Farm',
      farmerName: 'Gurmeet Kaur',
      region: 'Ludhiana',
      state: 'Punjab',
      grade: 'A',
      qualityScore: 89,
      quantityKg: 1600,
      pricePerKg: 35,
      harvestDate: '04/05/2026',
      availableUntil: '10/05/2026',
      freshnessScore: 93,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1704596931787-977e8fd53ef1',
      imageAlt: 'White cauliflower head with green leaves',
      minOrderKg: 100,
      farmerRating: 4.7,
      farmerOrders: 156,
      listedAt: 1746518400
    },
    {
      id: 'listing-006',
      cropType: 'Okra',
      variety: 'Arka Anamika — Tender',
      farmName: 'Murugan Farms',
      farmerName: 'S. Murugan',
      region: 'Coimbatore',
      state: 'Tamil Nadu',
      grade: 'A',
      qualityScore: 92,
      quantityKg: 620,
      pricePerKg: 52,
      harvestDate: '06/05/2026',
      availableUntil: '09/05/2026',
      freshnessScore: 97,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1696835537510-981fdb76321f',
      imageAlt: 'Fresh green okra pods arranged on cloth',
      minOrderKg: 50,
      farmerRating: 4.7,
      farmerOrders: 203,
      listedAt: 1746691200
    },
    {
      id: 'listing-007',
      cropType: 'Capsicum',
      variety: 'California Wonder — Mixed',
      farmName: 'Ranjit Polyhouse',
      farmerName: 'Ranjit Sharma',
      region: 'Pune',
      state: 'Maharashtra',
      grade: 'A',
      qualityScore: 96,
      quantityKg: 440,
      pricePerKg: 68,
      harvestDate: '05/05/2026',
      availableUntil: '11/05/2026',
      freshnessScore: 98,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1716434128604-e7bff11ec0a8',
      imageAlt: 'Colorful red yellow and green capsicum peppers',
      minOrderKg: 50,
      farmerRating: 4.9,
      farmerOrders: 128,
      listedAt: 1746604800
    },
    {
      id: 'listing-008',
      cropType: 'Brinjal',
      variety: 'Arka Shirish — Purple Long',
      farmName: 'Patel Vegetable Farm',
      farmerName: 'Dinesh Patel',
      region: 'Anand',
      state: 'Gujarat',
      grade: 'B',
      qualityScore: 74,
      quantityKg: 980,
      pricePerKg: 30,
      harvestDate: '02/05/2026',
      availableUntil: '09/05/2026',
      freshnessScore: 76,
      status: 'flash',
      isCooperative: 0,
      hasBlockchain: 0,
      isFlashSale: 1,
      imageUrl: 'https://images.unsplash.com/photo-1714751569833-85bb703b1b91',
      imageAlt: 'Dark purple brinjal eggplants on market stall',
      minOrderKg: 100,
      farmerRating: 4.2,
      farmerOrders: 89,
      listedAt: 1746259200
    },
    {
      id: 'listing-009',
      cropType: 'Carrot',
      variety: 'Nantes — Premium',
      farmName: 'Himachal Agro Collective',
      farmerName: 'Deepa Thakur',
      region: 'Shimla',
      state: 'Himachal Pradesh',
      grade: 'A',
      qualityScore: 93,
      quantityKg: 2200,
      pricePerKg: 42,
      harvestDate: '01/05/2026',
      availableUntil: '20/05/2026',
      freshnessScore: 91,
      status: 'active',
      isCooperative: 1,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1606355194341-10e4cf647387',
      imageAlt: 'Bunch of fresh orange carrots with green tops',
      minOrderKg: 200,
      farmerRating: 4.6,
      farmerOrders: 174,
      listedAt: 1746172800
    },
    {
      id: 'listing-010',
      cropType: 'Green Chilli',
      variety: 'Byadgi — Long Hot',
      farmName: 'Reddy Chilli Estate',
      farmerName: 'Venkat Reddy',
      region: 'Guntur',
      state: 'Andhra Pradesh',
      grade: 'A',
      qualityScore: 88,
      quantityKg: 750,
      pricePerKg: 58,
      harvestDate: '04/05/2026',
      availableUntil: '12/05/2026',
      freshnessScore: 94,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1648627743560-cd547111b443',
      imageAlt: 'Green chilli peppers in pile on burlap sack',
      minOrderKg: 50,
      farmerRating: 4.8,
      farmerOrders: 267,
      listedAt: 1746518400
    },
    {
      id: 'listing-buy-001',
      cropType: 'Wheat',
      variety: 'Lokwan Premium',
      farmName: 'Priya Merchants Procurement',
      farmerName: 'Priya Merchants',
      region: 'Mumbai Wholesale Hub',
      state: 'Maharashtra',
      grade: 'A',
      qualityScore: 92,
      quantityKg: 5000,
      pricePerKg: 26,
      harvestDate: 'Immediate',
      availableUntil: '30/06/2026',
      freshnessScore: 90,
      status: 'active',
      isCooperative: 0,
      hasBlockchain: 1,
      isFlashSale: 0,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b',
      imageAlt: 'Golden wheat grain under sunlight',
      minOrderKg: 500,
      farmerRating: 4.9,
      farmerOrders: 24,
      listedAt: 1746604800,
      isBuyRequest: 1
    }
  ];

  initialListings.forEach((l: any) => {
    insertListing.run(
      l.id, l.cropType, l.variety, l.farmName, l.farmerName, l.region, l.state, l.grade,
      l.qualityScore, l.quantityKg, l.pricePerKg, l.harvestDate, l.availableUntil,
      l.freshnessScore, l.status, l.isCooperative, l.hasBlockchain, l.isFlashSale,
      l.imageUrl, l.imageAlt, l.minOrderKg, l.farmerRating, l.farmerOrders, l.listedAt,
      l.isBuyRequest || 0
    );
  });
}

// Seed default orders if table is empty
const orderCount = db.prepare('SELECT count(*) as count FROM orders').get() as { count: number };
if (orderCount.count === 0) {
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, crop, qty, partner, location, totalVal, status, date, hasBlockchain, buyerPhone, sellerPhone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run('ord-801', 'Tomato (Grade A)', 1500, 'Ramesh Kumar', 'Nashik, MH', 45000, 'dispatched', '06 May 2026', 1, '9823456780', '9876543210');
  insertOrder.run('ord-802', 'Potato (Grade B)', 2500, 'Gurpreet Singh', 'Jalandhar, PB', 45000, 'pending', '07 May 2026', 1, '9823456780', '9876543210');
  insertOrder.run('ord-803', 'Onion (Grade A)', 1200, 'Balu Shinde', 'Lasalgaon, MH', 28800, 'delivered', '01 May 2026', 1, '9823456780', '9876543210');
  
  insertOrder.run('ord-901', 'Tomato (Grade A)', 1500, 'Priya Merchants', 'Mumbai, MH', 45000, 'dispatched', '06 May 2026', 1, '9823456780', '9876543210');
  insertOrder.run('ord-902', 'Capsicum (Grade A)', 800, 'FreshMart Retail', 'Pune, MH', 44000, 'delivered', '28 Apr 2026', 0, '9823456780', '9876543210');
}

export default db;
