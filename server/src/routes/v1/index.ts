import { Router } from 'express';
import authRoutes from './auth.routes';
import sellerRoutes from './seller.routes';
import transactionRoutes from './transaction.routes';
import reportsRoutes from './reports.routes';

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/sellers', sellerRoutes);
v1Router.use('/transactions', transactionRoutes);
v1Router.use('/reports', reportsRoutes);

export default v1Router;
