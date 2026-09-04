import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import sellerRoutes from './routes/sellerRoutes';
import transactionRoutes from './routes/transactionRoutes';
import reportRoutes from './routes/reportRoutes';
import { connectMongoDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Auto-ensure MongoDB connection for serverless (Vercel) & traditional containers (Railway)
app.use(async (req, res, next) => {
  try {
    await connectMongoDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Helper to resolve client/dist path across various runtimes (ts-node, node dist, Railway root)
const getClientDistPath = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) return c;
  }
  return null;
};

// Root landing endpoint
app.get('/', (req, res, next) => {
  const clientDist = getClientDistPath();
  if (clientDist) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  return res.status(200).json({
    success: true,
    name: 'Vasudha Polymer VTMS Express Server',
    status: 'Online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      sellers: '/api/v1/sellers',
      transactions: '/api/v1/transactions',
      reports: '/api/v1/reports',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Vasudha Polymer VTMS Express MongoDB Server is running.',
    timestamp: new Date().toISOString(),
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reports', reportRoutes);

// Static client build serving if client/dist exists
const resolvedClientDist = getClientDistPath();
if (resolvedClientDist) {
  app.use(express.static(resolvedClientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const indexPath = path.join(resolvedClientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

app.use(errorHandler);

export default app;
