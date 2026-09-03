import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SellerModel } from '../models/Seller';
import { TransactionModel } from '../models/Transaction';

export class SellerController {
  // GET /api/v1/sellers
  public static async getAllSellers(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search ? String(req.query.search).trim() : '';

      let filter = {};
      if (search) {
        filter = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { gstNumber: { $regex: search, $options: 'i' } },
          ],
        };
      }

      const sellers = await SellerModel.find(filter).sort({ createdAt: -1 }).lean();

      // Dynamically calculate totals for each seller
      const sellersWithTotals = await Promise.all(
        sellers.map(async (seller) => {
          const totals = await TransactionModel.aggregate([
            { $match: { sellerId: seller._id } },
            {
              $group: {
                _id: '$sellerId',
                totalDeliveries: {
                  $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$amount', 0] },
                },
                totalPaid: {
                  $sum: { $cond: [{ $eq: ['$type', 'PAYMENT'] }, '$amount', 0] },
                },
                tank500: {
                  $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$tank500', 0] },
                },
                tank1000: {
                  $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$tank1000', 0] },
                },
                tank2000: {
                  $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$tank2000', 0] },
                },
              },
            },
          ]);

          const totalDeliveries = totals[0]?.totalDeliveries || 0;
          const totalPaid = totals[0]?.totalPaid || 0;
          const totalDues = totalDeliveries - totalPaid;
          const tank500 = totals[0]?.tank500 || 0;
          const tank1000 = totals[0]?.tank1000 || 0;
          const tank2000 = totals[0]?.tank2000 || 0;
          const totalTanks = tank500 + tank1000 + tank2000;

          return {
            id: seller._id.toString(),
            name: seller.name,
            email: seller.email || null,
            phone: seller.phone || null,
            address: seller.address || null,
            gstNumber: seller.gstNumber || null,
            totalDeliveries,
            totalPaid,
            totalDues,
            tank500,
            tank1000,
            tank2000,
            totalTanks,
            createdAt: seller.createdAt,
          };
        })
      );

      const totalDeliveries = sellersWithTotals.reduce((sum, s) => sum + s.totalDeliveries, 0);
      const totalPaid = sellersWithTotals.reduce((sum, s) => sum + s.totalPaid, 0);
      const totalDues = totalDeliveries - totalPaid;
      const totalTank500 = sellersWithTotals.reduce((sum, s) => sum + (s.tank500 || 0), 0);
      const totalTank1000 = sellersWithTotals.reduce((sum, s) => sum + (s.tank1000 || 0), 0);
      const totalTank2000 = sellersWithTotals.reduce((sum, s) => sum + (s.tank2000 || 0), 0);
      const totalTanks = totalTank500 + totalTank1000 + totalTank2000;

      res.status(200).json({
        success: true,
        data: {
          sellers: sellersWithTotals,
          summary: {
            totalSellers: sellersWithTotals.length,
            totalDeliveries,
            totalPaid,
            totalDues,
            totalTank500,
            totalTank1000,
            totalTank2000,
            totalTanks,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error fetching sellers.' });
    }
  }

  // GET /api/v1/sellers/:id
  public static async getSellerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID format.' });
        return;
      }

      const seller = await SellerModel.findById(id).lean();
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller not found.' });
        return;
      }

      const transactions = await TransactionModel.find({ sellerId: seller._id })
        .sort({ date: -1 })
        .lean();

      let totalDeliveries = 0;
      let totalPaid = 0;
      let totalTank500 = 0;
      let totalTank1000 = 0;
      let totalTank2000 = 0;

      const formattedTransactions = transactions.map((tx) => {
        if (tx.type === 'DELIVERY') {
          totalDeliveries += tx.amount;
          totalTank500 += tx.tank500 || 0;
          totalTank1000 += tx.tank1000 || 0;
          totalTank2000 += tx.tank2000 || 0;
        } else if (tx.type === 'PAYMENT') {
          totalPaid += tx.amount;
        }

        return {
          id: tx._id.toString(),
          sellerId: tx.sellerId.toString(),
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

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
      const totalTx = formattedTransactions.length;
      const totalPages = Math.ceil(totalTx / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedTransactions = formattedTransactions.slice(startIndex, startIndex + limit);

      const totalDues = totalDeliveries - totalPaid;
      const totalTanks = totalTank500 + totalTank1000 + totalTank2000;

      res.status(200).json({
        success: true,
        data: {
          seller: {
            id: seller._id.toString(),
            name: seller.name,
            email: seller.email || null,
            phone: seller.phone || null,
            address: seller.address || null,
            gstNumber: seller.gstNumber || null,
            totalDeliveries,
            totalPaid,
            totalDues,
            tank500: totalTank500,
            tank1000: totalTank1000,
            tank2000: totalTank2000,
            totalTanks,
            transactions: paginatedTransactions,
            pagination: {
              total: totalTx,
              page,
              limit,
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
            createdAt: seller.createdAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error fetching seller detail.' });
    }
  }

  // POST /api/v1/sellers
  public static async createSeller(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, address, gstNumber } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, error: 'Seller name is required.' });
        return;
      }

      const seller = await SellerModel.create({
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        gstNumber: gstNumber ? gstNumber.trim() : null,
      });

      res.status(201).json({
        success: true,
        data: {
          id: seller._id.toString(),
          name: seller.name,
          email: seller.email || null,
          phone: seller.phone || null,
          address: seller.address || null,
          gstNumber: seller.gstNumber || null,
          totalDeliveries: 0,
          totalPaid: 0,
          totalDues: 0,
          tank500: 0,
          tank1000: 0,
          tank2000: 0,
          totalTanks: 0,
          createdAt: seller.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error creating seller.' });
    }
  }

  // PUT /api/v1/sellers/:id
  public static async updateSeller(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone, address, gstNumber } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID format.' });
        return;
      }

      const seller = await SellerModel.findById(id);
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller account not found.' });
        return;
      }

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          res.status(400).json({ success: false, error: 'Seller name cannot be empty.' });
          return;
        }
        seller.name = name.trim();
      }

      if (email !== undefined) seller.email = email ? email.trim() : null;
      if (phone !== undefined) seller.phone = phone ? phone.trim() : null;
      if (address !== undefined) seller.address = address ? address.trim() : null;
      if (gstNumber !== undefined) seller.gstNumber = gstNumber ? gstNumber.trim() : null;

      await seller.save();

      res.status(200).json({
        success: true,
        message: 'Seller updated successfully.',
        data: {
          seller: {
            id: seller._id.toString(),
            name: seller.name,
            email: seller.email || null,
            phone: seller.phone || null,
            address: seller.address || null,
            gstNumber: seller.gstNumber || null,
            updatedAt: seller.updatedAt,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error updating seller.' });
    }
  }

  // DELETE /api/v1/sellers/:id (Admin only)
  public static async deleteSeller(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID format.' });
        return;
      }

      const seller = await SellerModel.findByIdAndDelete(id);
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller account not found.' });
        return;
      }

      // Delete associated transactions
      await TransactionModel.deleteMany({ sellerId: id });

      res.status(200).json({
        success: true,
        message: 'Seller and associated transactions deleted successfully.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error deleting seller.' });
    }
  }
}
