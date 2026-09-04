import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SellerModel } from '../models/Seller';
import { TransactionModel } from '../models/Transaction';

export class SellerController {
  // GET /api/v1/sellers
  public static async getAllSellers(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search ? String(req.query.search).trim() : '';

      let filter: any = {};
      if (search) {
        filter = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { gstNumber: { $regex: search, $options: 'i' } },
          ],
        };
      }

      const totalSellers = await SellerModel.countDocuments(filter);

      // Pagination
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalSellers / limit) || 1;

      // Fetch only the current page of sellers
      const pageSellers = await SellerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Aggregate totals ONLY for the sellers on the current page
      const pageSellerIds = pageSellers.map((s) => s._id);

      const perSellerTotals = pageSellerIds.length > 0
        ? await TransactionModel.aggregate([
            { $match: { sellerId: { $in: pageSellerIds } } },
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
          ])
        : [];

      const totalsMap = new Map<string, any>();
      for (const t of perSellerTotals) {
        totalsMap.set(t._id.toString(), t);
      }

      const formattedSellers = pageSellers.map((seller) => {
        const t = totalsMap.get(seller._id.toString());
        const totalDeliveries = Math.round((t?.totalDeliveries || 0) * 100) / 100;
        const totalPaid = Math.round((t?.totalPaid || 0) * 100) / 100;
        const totalDues = Math.round((totalDeliveries - totalPaid) * 100) / 100;
        const tank500 = t?.tank500 || 0;
        const tank1000 = t?.tank1000 || 0;
        const tank2000 = t?.tank2000 || 0;
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
      });

      // Global Summary across database in a single fast aggregation
      const [globalTotalsAgg, totalAllSellersCount] = await Promise.all([
        TransactionModel.aggregate([
          {
            $group: {
              _id: null,
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
        ]),
        search ? SellerModel.countDocuments() : Promise.resolve(totalSellers),
      ]);

      const globalDeliveries = Math.round((globalTotalsAgg[0]?.totalDeliveries || 0) * 100) / 100;
      const globalPaid = Math.round((globalTotalsAgg[0]?.totalPaid || 0) * 100) / 100;
      const globalDues = Math.round((globalDeliveries - globalPaid) * 100) / 100;
      const globalTank500 = globalTotalsAgg[0]?.tank500 || 0;
      const globalTank1000 = globalTotalsAgg[0]?.tank1000 || 0;
      const globalTank2000 = globalTotalsAgg[0]?.tank2000 || 0;
      const globalTotalTanks = globalTank500 + globalTank1000 + globalTank2000;

      res.status(200).json({
        success: true,
        data: {
          sellers: formattedSellers,
          pagination: {
            total: totalSellers,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          summary: {
            totalSellers: totalAllSellersCount,
            totalDeliveries: globalDeliveries,
            totalPaid: globalPaid,
            totalDues: globalDues,
            totalTank500: globalTank500,
            totalTank1000: globalTank1000,
            totalTank2000: globalTank2000,
            totalTanks: globalTotalTanks,
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
        .sort({ date: -1, createdAt: -1 })
        .lean();

      let totalDeliveries = 0;
      let totalPaid = 0;
      let totalTank500 = 0;
      let totalTank1000 = 0;
      let totalTank2000 = 0;

      // Group payments by parentId and map deliveries
      const paymentsByParentId = new Map<string, any[]>();
      const deliveryMap = new Map<string, any>();

      for (const tx of transactions) {
        const txId = tx._id.toString();
        if (tx.type === 'DELIVERY') {
          totalDeliveries += tx.amount;
          totalTank500 += tx.tank500 || 0;
          totalTank1000 += tx.tank1000 || 0;
          totalTank2000 += tx.tank2000 || 0;
          deliveryMap.set(txId, tx);
        } else if (tx.type === 'PAYMENT') {
          totalPaid += tx.amount;
          if (tx.parentId) {
            const pid = tx.parentId.toString();
            if (!paymentsByParentId.has(pid)) {
              paymentsByParentId.set(pid, []);
            }
            paymentsByParentId.get(pid)!.push(tx);
          }
        }
      }

      const formattedTransactions = transactions.map((tx) => {
        const txId = tx._id.toString();
        const baseTx: any = {
          id: txId,
          sellerId: tx.sellerId.toString(),
          parentId: tx.parentId ? tx.parentId.toString() : null,
          type: tx.type,
          amount: Math.round(tx.amount * 100) / 100,
          date: tx.date,
          note: tx.note || null,
          tank500: tx.tank500 || 0,
          tank1000: tx.tank1000 || 0,
          tank2000: tx.tank2000 || 0,
          paymentMode: tx.paymentMode || null,
          createdAt: tx.createdAt,
        };

        if (tx.type === 'DELIVERY') {
          const rawLinked = paymentsByParentId.get(txId) || [];
          const linkedPayments = rawLinked.map((p) => ({
            id: p._id.toString(),
            sellerId: p.sellerId.toString(),
            parentId: txId,
            type: p.type,
            amount: Math.round(p.amount * 100) / 100,
            date: p.date,
            note: p.note || null,
            paymentMode: p.paymentMode || null,
            createdAt: p.createdAt,
          }));

          const rawPaid = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
          const paidAmount = Math.round(rawPaid * 100) / 100;
          const remainingDue = Math.max(0, Math.round((baseTx.amount - paidAmount) * 100) / 100);

          baseTx.paidAmount = paidAmount;
          baseTx.remainingDue = remainingDue;
          baseTx.linkedPayments = linkedPayments;
        } else if (tx.type === 'PAYMENT') {
          if (tx.parentId) {
            const parent = deliveryMap.get(tx.parentId.toString());
            if (parent) {
              baseTx.parentDelivery = {
                id: parent._id.toString(),
                date: parent.date,
                amount: Math.round(parent.amount * 100) / 100,
                note: parent.note || null,
              };
            } else {
              baseTx.parentDelivery = null;
            }
          } else {
            baseTx.parentDelivery = null;
          }
        }

        return baseTx;
      });

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
      const totalTx = formattedTransactions.length;
      const totalPages = Math.ceil(totalTx / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedTransactions = formattedTransactions.slice(startIndex, startIndex + limit);

      totalDeliveries = Math.round(totalDeliveries * 100) / 100;
      totalPaid = Math.round(totalPaid * 100) / 100;
      const totalDues = Math.round((totalDeliveries - totalPaid) * 100) / 100;
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
