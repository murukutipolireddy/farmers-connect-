import { Router, Request, Response } from 'express';
import { getListings, createListing, updateListing, deleteListing } from '../lib/dbAdapter';

const router = Router();

// GET /api/listings
router.get('/', async (req: Request, res: Response) => {
  try {
    const crop = req.query.crop as string | undefined;
    const grade = req.query.grade as string | undefined;
    const region = req.query.region as string | undefined;
    const flash = req.query.flash as string | undefined;
    const isBuyRequest = req.query.isBuyRequest as string | undefined;

    const listings = await getListings({
      crop: crop || null,
      grade: grade || null,
      region: region || null,
      flash: flash || null,
      isBuyRequest: isBuyRequest || null
    });

    const mappedListings = listings.map((l) => ({
      ...l,
      isCooperative: Boolean(l.isCooperative),
      hasBlockchain: Boolean(l.hasBlockchain),
      isFlashSale: Boolean(l.isFlashSale),
      certifications: l.cropType === 'Tomato' ? ['APEDA', 'Organic India'] : ['FSSAI Certified']
    }));

    return res.json(mappedListings);
  } catch (error: any) {
    console.error('Listings GET error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

// POST /api/listings
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      cropType, variety, farmName, farmerName, region, state, grade,
      qualityScore, quantityKg, pricePerKg, harvestDate, availableUntil,
      freshnessScore, isCooperative, hasBlockchain, isFlashSale, imageUrl,
      isBuyRequest
    } = req.body;

    if (!cropType || !variety || !farmName || !farmerName || !region || !state || !grade) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = `listing-${Date.now()}`;

    const newListing = {
      id,
      cropType,
      variety,
      farmName,
      farmerName,
      region,
      state,
      grade,
      qualityScore: qualityScore || 90,
      quantityKg: Number(quantityKg),
      pricePerKg: Number(pricePerKg),
      harvestDate: harvestDate || 'Today',
      availableUntil: availableUntil || 'In 7 days',
      freshnessScore: freshnessScore || 95,
      status: isFlashSale ? 'flash' : 'active',
      isCooperative: Boolean(isCooperative),
      hasBlockchain: Boolean(hasBlockchain),
      isFlashSale: Boolean(isFlashSale),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1723234387588-756c4d1e3e1a',
      imageAlt: cropType,
      minOrderKg: 100,
      farmerRating: 4.8,
      farmerOrders: 120,
      listedAt: Math.floor(Date.now() / 1000),
      isBuyRequest: Boolean(isBuyRequest)
    };

    await createListing(newListing);

    return res.status(201).json({ id, cropType, variety, success: true });
  } catch (error: any) {
    console.error('Listings POST error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

// PUT /api/listings/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updates = req.body;
    const success = await updateListing(id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    return res.json({ success: true, id });
  } catch (error: any) {
    console.error('Listings PUT error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const success = await deleteListing(id);
    if (!success) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    return res.json({ success: true, id });
  } catch (error: any) {
    console.error('Listings DELETE error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

export default router;
