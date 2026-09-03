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

// Root landing endpoint
app.get('/', (req, res, next) => {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
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
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

app.use(errorHandler);

export default app;
