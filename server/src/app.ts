import express from 'express';
import cors from 'cors';
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

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Vasudha Polymer VTMS Express MongoDB Server is running.' });
});

app.use(errorHandler);

export default app;
