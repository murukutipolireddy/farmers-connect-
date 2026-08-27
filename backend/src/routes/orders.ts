import { Router, Request, Response } from 'express';
import { getOrders, getListingById, getUserByCredentials, createOrderTransaction, updateOrderStatus } from '../lib/dbAdapter';

const router = Router();

// GET /api/orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const phone = req.query.phone as string | undefined;
    const role = req.query.role as string | undefined;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const orders = await getOrders(phone, role || 'farmer');

    return res.json(orders);
  } catch (error: any) {
    console.error('Orders GET error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const { listingId, qty, buyerPhone, offerPrice } = req.body;

    if (!listingId || !qty || !buyerPhone) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 1. Fetch listing details
    const listing = await getListingById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.quantityKg < qty) {
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }

    // Determine buyer/seller phones and partner name dynamically based on isBuyRequest
    let buyerPhoneNum = buyerPhone;
    let sellerPhoneNum = '9876543210';
    let partnerName = listing.farmerName;
    let locationVal = `${listing.region}, ${(listing.state || '').substring(0, 2).toUpperCase()}`;

    const isBuyRequest = listing.isBuyRequest === 1 || listing.isBuyRequest === true;

    if (isBuyRequest) {
      // If it's a Buy Request posted by a Retailer:
      const buyerUser = await getUserByCredentials(listing.farmerName); // Look up by name
      buyerPhoneNum = buyerUser ? buyerUser.phone : '9823456780';
      
      // The Farmer who clicked "Sell to Retailer" is the seller (buyerPhone parameter)
      sellerPhoneNum = buyerPhone;

      const sellerUser = await getUserByCredentials(sellerPhoneNum);
      partnerName = sellerUser ? sellerUser.name : 'Farmer Partner';
      
      if (sellerUser) {
        locationVal = `${sellerUser.region}, ${(sellerUser.state || '').substring(0, 2).toUpperCase()}`;
      }
    } else {
      // Traditional Sell Listing posted by a Farmer:
      buyerPhoneNum = buyerPhone;
      
      const sellerUser = await getUserByCredentials(listing.farmerName); // Look up by name
      sellerPhoneNum = sellerUser ? sellerUser.phone : '9876543210';
    }

    const orderId = `ord-${Date.now().toString().substring(8)}`;
    const resolvedPrice = offerPrice ? Number(offerPrice) : listing.pricePerKg;
    const totalVal = Number(qty) * resolvedPrice;

    // Run transaction via adapter
    await createOrderTransaction({
      orderId,
      listingId,
      qty,
      resolvedPrice,
      totalVal,
      buyerPhoneNum,
      sellerPhoneNum,
      partnerName,
      locationVal
    });

    return res.status(201).json({ orderId, success: true });
  } catch (error: any) {
    console.error('Orders POST error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

// PUT /api/orders
router.put('/', async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing orderId or status' });
    }

    const success = await updateOrderStatus(orderId, status);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ success: true, status });
  } catch (error: any) {
    console.error('Orders PUT error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const { status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing orderId or status' });
    }

    const success = await updateOrderStatus(orderId, status);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ success: true, orderId, status, message: `Order status updated to ${status}` });
  } catch (error: any) {
    console.error('Orders PATCH error:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message || error}` });
  }
});

export default router;
