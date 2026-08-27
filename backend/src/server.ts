import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import listingsRoutes from './routes/listings';
import ordersRoutes from './routes/orders';
import aiRoutes from './routes/ai';

const app = express();
const PORT = process.env.PORT || 4029;

// Middleware
app.use(cors({
  origin: ['http://localhost:4028', 'http://127.0.0.1:4028'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AgriMart Backend Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Auth:         http://localhost:${PORT}/api/auth/login`);
  console.log(`   Listings:     http://localhost:${PORT}/api/listings`);
  console.log(`   Orders:       http://localhost:${PORT}/api/orders\n`);
});

export default app;
