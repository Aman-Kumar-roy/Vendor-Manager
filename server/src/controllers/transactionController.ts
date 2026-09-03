import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TransactionModel } from '../models/Transaction';
import { SellerModel } from '../models/Seller';

export class TransactionController {
  // GET /api/v1/transactions
  // GET /api/v1/transactions?page=1&limit=10&search=...&type=...&sellerId=...
  public static async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId, type, page, limit, search } = req.query;

      let filter: any = {};
      if (sellerId && mongoose.Types.ObjectId.isValid(String(sellerId))) {
        filter.sellerId = new mongoose.Types.ObjectId(String(sellerId));
      }
      if (type && ['DELIVERY', 'PAYMENT'].includes(String(type).toUpperCase())) {
        filter.type = String(type).toUpperCase();
      }

      if (search && typeof search === 'string' && search.trim().length > 0) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const matchingSellers = await SellerModel.find({
          $or: [
            { name: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
          ],
        }).select('_id').lean();

        const matchingSellerIds = matchingSellers.map((s) => s._id);
        const searchConditions: any[] = [
          { note: searchRegex },
          { paymentMode: searchRegex },
        ];

        if (matchingSellerIds.length > 0) {
          searchConditions.push({ sellerId: { $in: matchingSellerIds } });
        }

        if (mongoose.Types.ObjectId.isValid(search.trim())) {
          searchConditions.push({ _id: new mongoose.Types.ObjectId(search.trim()) });
        }

        filter.$or = searchConditions;
      }

      const totalCount = await TransactionModel.countDocuments(filter);

      const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
      const pageNum = Math.max(1, parseInt(String(page || 1), 10) || 1);
      const limitNum = isPaginated ? Math.max(1, parseInt(String(limit || 10), 10) || 10) : (totalCount || 10);
      const skip = isPaginated ? (pageNum - 1) * limitNum : 0;

      const query = TransactionModel.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .populate('sellerId', 'name email phone address gstNumber')
        .lean();

      if (isPaginated) {
        query.skip(skip).limit(limitNum);
      }

      const transactions = await query;

      const formatted = transactions.map((tx: any) => {
        const sellerObj = tx.sellerId && typeof tx.sellerId === 'object' ? tx.sellerId : null;
        return {
          id: tx._id.toString(),
          sellerId: sellerObj ? sellerObj._id.toString() : (tx.sellerId ? tx.sellerId.toString() : ''),
          sellerName: sellerObj ? sellerObj.name : 'Vendor Account',
          sellerEmail: sellerObj ? sellerObj.email || null : null,
          sellerPhone: sellerObj ? sellerObj.phone || null : null,
          sellerAddress: sellerObj ? sellerObj.address || null : null,
          sellerGstNumber: sellerObj ? sellerObj.gstNumber || null : null,
          parentId: tx.parentId ? tx.parentId.toString() : null,
          type: tx.type,
          amount: tx.amount,
          date: tx.date,
          note: tx.note || null,
          tank500: tx.tank500 || 0,
          tank1000: tx.tank1000 || 0,
          tank2000: tx.tank2000 || 0,
          paymentMode: tx.paymentMode || null,
          createdAt: tx.createdAt,
        };
      });

      const totalPages = isPaginated ? Math.ceil(totalCount / limitNum) || 1 : 1;

      res.status(200).json({
        success: true,
        data: {
          transactions: formatted,
          pagination: {
            total: totalCount,
            page: isPaginated ? pageNum : 1,
            limit: isPaginated ? limitNum : totalCount,
            totalPages,
            hasNextPage: isPaginated ? pageNum < totalPages : false,
            hasPrevPage: isPaginated ? pageNum > 1 : false,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error fetching transactions.' });
    }
  }

  // POST /api/v1/transactions
  public static async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { sellerId, parentId, type, amount, note, tank500, tank1000, tank2000, paymentMode, date } = req.body;

      if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
        res.status(400).json({ success: false, error: 'Valid seller ID is required.' });
        return;
      }

      const seller = await SellerModel.findById(sellerId);
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller not found.' });
        return;
      }

      if (!type || !['DELIVERY', 'PAYMENT'].includes(type)) {
        res.status(400).json({ success: false, error: 'Transaction type must be "DELIVERY" or "PAYMENT".' });
        return;
      }

      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
        return;
      }

      const transaction = await TransactionModel.create({
        sellerId: new mongoose.Types.ObjectId(sellerId),
        parentId: parentId && mongoose.Types.ObjectId.isValid(parentId) ? new mongoose.Types.ObjectId(parentId) : null,
        type,
        amount: parsedAmount,
        date: date ? new Date(date) : new Date(),
        note: note ? String(note).trim() : null,
        tank500: type === 'DELIVERY' ? Number(tank500) || 0 : 0,
        tank1000: type === 'DELIVERY' ? Number(tank1000) || 0 : 0,
        tank2000: type === 'DELIVERY' ? Number(tank2000) || 0 : 0,
        paymentMode: type === 'PAYMENT' ? (paymentMode ? String(paymentMode).trim() : null) : null,
      });

      res.status(201).json({
        success: true,
        data: {
          id: transaction._id.toString(),
          sellerId: transaction.sellerId.toString(),
          parentId: transaction.parentId ? transaction.parentId.toString() : null,
          type: transaction.type,
          amount: transaction.amount,
          date: transaction.date,
          note: transaction.note || null,
          tank500: transaction.tank500 || 0,
          tank1000: transaction.tank1000 || 0,
          tank2000: transaction.tank2000 || 0,
          paymentMode: transaction.paymentMode || null,
          createdAt: transaction.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error recording transaction.' });
    }
  }

  // PUT /api/v1/transactions/:id
  public static async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, date, note, tank500, tank1000, tank2000, paymentMode } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.' });
        return;
      }

      const transaction = await TransactionModel.findById(id);
      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction record not found.' });
        return;
      }

      if (amount !== undefined) {
        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
          return;
        }
        transaction.amount = parsedAmount;
      }

      if (date !== undefined) transaction.date = new Date(date);
      if (note !== undefined) transaction.note = note ? String(note).trim() : undefined;

      if (transaction.type === 'DELIVERY') {
        if (tank500 !== undefined) transaction.tank500 = Number(tank500) || 0;
        if (tank1000 !== undefined) transaction.tank1000 = Number(tank1000) || 0;
        if (tank2000 !== undefined) transaction.tank2000 = Number(tank2000) || 0;
      } else if (transaction.type === 'PAYMENT') {
        if (paymentMode !== undefined) transaction.paymentMode = paymentMode ? String(paymentMode).trim() : undefined;
      }

      await transaction.save();

      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully.',
        data: {
          transaction: {
            id: transaction._id.toString(),
            sellerId: transaction.sellerId.toString(),
            parentId: transaction.parentId ? transaction.parentId.toString() : null,
            type: transaction.type,
            amount: transaction.amount,
            date: transaction.date,
            note: transaction.note || null,
            tank500: transaction.tank500 || 0,
            tank1000: transaction.tank1000 || 0,
            tank2000: transaction.tank2000 || 0,
            paymentMode: transaction.paymentMode || null,
            updatedAt: transaction.updatedAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error updating transaction.' });
    }
  }

  // DELETE /api/v1/transactions/:id (Admin only)
  public static async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.' });
        return;
      }

      const tx = await TransactionModel.findByIdAndDelete(id);
      if (!tx) {
        res.status(404).json({ success: false, error: 'Transaction record not found.' });
        return;
      }

      // If deleting a delivery, also clean up child payments linked to it
      if (tx.type === 'DELIVERY') {
        await TransactionModel.deleteMany({ parentId: id });
      }

      res.status(200).json({
        success: true,
        message: 'Transaction record deleted successfully.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error deleting transaction.' });
    }
  }
}
