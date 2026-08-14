import express from 'express';
import cors from 'cors';
import v1Router from './routes/v1';
import { errorHandler } from './middleware/error.middleware';

import { env } from './config/env';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', apiVersion: 'v1', timestamp: new Date().toISOString() });
});

// API Version 1 Routes
app.use('/api/v1', v1Router);

// 404 Handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
