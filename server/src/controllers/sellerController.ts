import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SellerModel } from '../models/Seller';
import { TransactionModel } from '../models/Transaction';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class SellerController {
  // GET /api/v1/sellers
  public static async getAllSellers(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search ? String(req.query.search).trim().slice(0, 100) : '';

      let filter: any = {};
      if (search) {
        const safeRegex = new RegExp(escapeRegex(search), 'i');
        filter = {
          $or: [
            { name: safeRegex },
            { phone: safeRegex },
            { gstNumber: safeRegex },
          ],
        };
      }

      const totalSellers = await SellerModel.countDocuments(filter);

      // Pagination with safe limits
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string, 10) || 10, 100));
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
        const totalTanks = tank500 + tank1000;

        const advanceCredit = Math.max(0, -totalDues);
        const isOverpaid = totalDues < 0;

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
          advanceCredit,
          isOverpaid,
          tank500,
          tank1000,
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
      const globalTotalTanks = globalTank500 + globalTank1000;

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
        res.status(400).json({ success: false, error: 'Invalid seller ID format.', message: 'Invalid seller ID format.' });
        return;
      }

      const seller = await SellerModel.findById(id).lean();
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller not found.', message: 'Seller not found.' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(parseInt(req.query.limit as string, 10) || 10, 100));
      const skip = (page - 1) * limit;

      // Parallel execution: Lifetime stats aggregation, total count, and database-level paginated slice
      const [totalsAgg, totalTx, pageTransactions] = await Promise.all([
        TransactionModel.aggregate([
          { $match: { sellerId: seller._id } },
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
            },
          },
        ]),
        TransactionModel.countDocuments({ sellerId: seller._id }),
        TransactionModel.find({ sellerId: seller._id })
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(totalTx / limit) || 1;

      // Extract delivery IDs and parent IDs only for items on the current page
      const deliveryIds = pageTransactions
        .filter((tx) => tx.type === 'DELIVERY')
        .map((tx) => tx._id);
      const parentIds = pageTransactions
        .filter((tx) => tx.type === 'PAYMENT' && tx.parentId)
        .map((tx) => tx.parentId);

      const [childPayments, parentDeliveries] = await Promise.all([
        deliveryIds.length > 0
          ? TransactionModel.find({ parentId: { $in: deliveryIds }, type: 'PAYMENT' }).lean()
          : Promise.resolve([]),
        parentIds.length > 0
          ? TransactionModel.find({ _id: { $in: parentIds }, type: 'DELIVERY' }).lean()
          : Promise.resolve([]),
      ]);

      const paymentsByParentId = new Map<string, any[]>();
      for (const p of childPayments) {
        if (!p.parentId) continue;
        const pid = p.parentId.toString();
        if (!paymentsByParentId.has(pid)) paymentsByParentId.set(pid, []);
        paymentsByParentId.get(pid)!.push(p);
      }

      const deliveryMap = new Map<string, any>();
      for (const d of parentDeliveries) {
        deliveryMap.set(d._id.toString(), d);
      }

      const formattedTransactions = pageTransactions.map((tx) => {
        const txId = tx._id.toString();
        const prevDues = tx.previousDues !== undefined && tx.previousDues !== null
          ? Math.round(Number(tx.previousDues) * 100) / 100
          : 0;
        const currDues = Math.round(
          (prevDues + (tx.type === 'DELIVERY' ? tx.amount : -tx.amount)) * 100
        ) / 100;

        const baseTx: any = {
          id: txId,
          _id: txId,
          sellerId: seller._id.toString(),
          sellerName: seller.name,
          sellerPhone: seller.phone || null,
          sellerEmail: seller.email || null,
          sellerAddress: seller.address || null,
          sellerGstNumber: seller.gstNumber || null,
          seller: {
            id: seller._id.toString(),
            _id: seller._id.toString(),
            name: seller.name,
            phone: seller.phone || null,
            email: seller.email || null,
            address: seller.address || null,
            gstNumber: seller.gstNumber || null,
          },
          parentId: tx.parentId ? tx.parentId.toString() : null,
          type: tx.type,
          amount: Math.round(tx.amount * 100) / 100,
          previousDues: prevDues,
          currentDues: currDues,
          isPreviousAdvance: prevDues < 0,
          isCurrentAdvance: currDues < 0,
          previousDuesFormatted: prevDues < 0
            ? `+ ₹ ${Math.abs(prevDues).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `₹ ${Math.abs(prevDues).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          currentDuesFormatted: currDues < 0
            ? `+ ₹ ${Math.abs(currDues).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `₹ ${Math.abs(currDues).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          date: tx.date,
          note: tx.note || null,
          tankItems: tx.tankItems || [],
          tank500: tx.tank500 || 0,
          tank1000: tx.tank1000 || 0,
          tank500_layers: tx.tank500_layers || null,
          tank1000_layers: tx.tank1000_layers || null,
          tank1000_foam: tx.tank1000_foam || 'none',
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

          const advanceCredit = Math.max(0, -prevDues);
          const rawPaid = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
          const paidAmount = Math.round(rawPaid * 100) / 100;
          const remainingDue = Math.max(0, Math.round((baseTx.amount - advanceCredit - paidAmount) * 100) / 100);

          baseTx.advanceCredit = advanceCredit;
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

      const totalDeliveries = Math.round((totalsAgg[0]?.totalDeliveries || 0) * 100) / 100;
      const totalPaid = Math.round((totalsAgg[0]?.totalPaid || 0) * 100) / 100;
      const totalDues = Math.round((totalDeliveries - totalPaid) * 100) / 100;
      const advanceCredit = Math.max(0, -totalDues);
      const isOverpaid = totalDues < 0;
      const totalTank500 = totalsAgg[0]?.tank500 || 0;
      const totalTank1000 = totalsAgg[0]?.tank1000 || 0;
      const totalTanks = totalTank500 + totalTank1000;

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
            advanceCredit,
            isOverpaid,
            tank500: totalTank500,
            tank1000: totalTank1000,
            totalTanks,
            transactions: formattedTransactions,
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
      const errMsg = error.message || 'Error fetching seller detail.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // POST /api/v1/sellers
  public static async createSeller(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, address, gstNumber, requireAdditional } = req.body;

      // Validate Seller Name (always mandatory)
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          success: false,
          error: 'Seller name is required.',
          message: 'Seller name is required.',
        });
        return;
      }

      // Determine toggle state: ON (true) by default if omitted, null, or undefined
      const isToggleOn =
        requireAdditional === undefined || requireAdditional === null
          ? true
          : typeof requireAdditional === 'string'
          ? requireAdditional.toLowerCase() !== 'false'
          : Boolean(requireAdditional);

      const trimmedEmail = email && typeof email === 'string' ? email.trim() : '';
      const trimmedGst = gstNumber && typeof gstNumber === 'string' ? gstNumber.trim().toUpperCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (isToggleOn) {
        // When Toggle is ON: Name, Email, and GST Number are mandatory
        if (!trimmedEmail) {
          res.status(400).json({
            success: false,
            error: 'Email address is required when additional fields are enabled.',
            message: 'Email address is required when additional fields are enabled.',
          });
          return;
        }

        if (!emailRegex.test(trimmedEmail)) {
          res.status(400).json({
            success: false,
            error: 'Please enter a valid email address.',
            message: 'Please enter a valid email address.',
          });
          return;
        }

        if (!trimmedGst) {
          res.status(400).json({
            success: false,
            error: 'GST number is required when additional fields are enabled.',
            message: 'GST number is required when additional fields are enabled.',
          });
          return;
        }
      } else {
        // When Toggle is OFF: Email is optional, but must be valid if provided
        if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
          res.status(400).json({
            success: false,
            error: 'Please enter a valid email address.',
            message: 'Please enter a valid email address.',
          });
          return;
        }
      }

      const trimmedPhone = phone && typeof phone === 'string' ? phone.trim() : null;
      const trimmedAddress = address && typeof address === 'string' ? address.trim() : null;

      const seller = await SellerModel.create({
        name: name.trim(),
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        address: trimmedAddress || null,
        gstNumber: trimmedGst || null,
      });

      const formattedSeller = {
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
        totalTanks: 0,
        createdAt: seller.createdAt,
      };

      res.status(201).json({
        success: true,
        message: 'Seller created successfully.',
        seller: formattedSeller,
        data: {
          ...formattedSeller,
          seller: formattedSeller,
        },
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error creating seller.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // PUT /api/v1/sellers/:id
  public static async updateSeller(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone, address, gstNumber } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID format.', message: 'Invalid seller ID format.' });
        return;
      }

      const seller = await SellerModel.findById(id);
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller account not found.', message: 'Seller account not found.' });
        return;
      }

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          res.status(400).json({ success: false, error: 'Seller name cannot be empty.', message: 'Seller name cannot be empty.' });
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
      const errMsg = error.message || 'Error updating seller.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // DELETE /api/v1/sellers/:id (Admin only)
  public static async deleteSeller(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID format.', message: 'Invalid seller ID format.' });
        return;
      }

      const seller = await SellerModel.findByIdAndDelete(id);
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller account not found.', message: 'Seller account not found.' });
        return;
      }

      // Delete associated transactions
      await TransactionModel.deleteMany({ sellerId: id });

      res.status(200).json({
        success: true,
        message: 'Seller and associated transactions deleted successfully.',
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error deleting seller.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }
}
