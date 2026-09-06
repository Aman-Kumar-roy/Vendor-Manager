import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TransactionModel } from '../models/Transaction';
import { SellerModel } from '../models/Seller';
import { PdfReceiptService } from '../services/pdfReceiptService';

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

      // Extract delivery IDs and payment parentIds to populate linkages
      const deliveryIds = transactions
        .filter((tx: any) => tx.type === 'DELIVERY')
        .map((tx: any) => tx._id);
      const parentIds = transactions
        .filter((tx: any) => tx.type === 'PAYMENT' && tx.parentId)
        .map((tx: any) => tx.parentId);

      const [childPayments, parentDeliveries] = await Promise.all([
        deliveryIds.length > 0
          ? TransactionModel.find({ parentId: { $in: deliveryIds }, type: 'PAYMENT' }).lean()
          : Promise.resolve([]),
        parentIds.length > 0
          ? TransactionModel.find({ _id: { $in: parentIds }, type: 'DELIVERY' }).lean()
          : Promise.resolve([]),
      ]);

      const paymentsByParent = new Map<string, any[]>();
      for (const p of childPayments) {
        if (!p.parentId) continue;
        const pid = p.parentId.toString();
        if (!paymentsByParent.has(pid)) paymentsByParent.set(pid, []);
        paymentsByParent.get(pid)!.push(p);
      }

      const parentDeliveryMap = new Map<string, any>();
      for (const d of parentDeliveries) {
        parentDeliveryMap.set(d._id.toString(), d);
      }

      // Check for any unpopulated seller IDs to query from SellerModel
      const unpopulatedSellerIds = transactions
        .filter((tx: any) => !tx.sellerId || typeof tx.sellerId !== 'object' || !tx.sellerId.name)
        .map((tx: any) => tx.sellerId)
        .filter(Boolean);

      const fallbackSellerMap = new Map<string, any>();
      if (unpopulatedSellerIds.length > 0) {
        const fallbackSellers = await SellerModel.find({ _id: { $in: unpopulatedSellerIds } }).lean();
        for (const s of fallbackSellers) {
          fallbackSellerMap.set(s._id.toString(), s);
        }
      }

      const formatted = transactions.map((tx: any) => {
        const txId = tx._id.toString();
        let sellerObj = tx.sellerId && typeof tx.sellerId === 'object' && tx.sellerId.name ? tx.sellerId : null;
        if (!sellerObj && tx.sellerId) {
          sellerObj = fallbackSellerMap.get(tx.sellerId.toString()) || null;
        }

        const baseTx: any = {
          id: txId,
          _id: txId,
          sellerId: sellerObj ? sellerObj._id.toString() : (tx.sellerId ? tx.sellerId.toString() : ''),
          sellerName: sellerObj ? sellerObj.name : 'Valued Vendor',
          sellerEmail: sellerObj ? sellerObj.email || null : null,
          sellerPhone: sellerObj ? sellerObj.phone || null : null,
          sellerAddress: sellerObj ? sellerObj.address || null : null,
          sellerGstNumber: sellerObj ? sellerObj.gstNumber || null : null,
          seller: sellerObj
            ? {
                id: sellerObj._id.toString(),
                _id: sellerObj._id.toString(),
                name: sellerObj.name,
                phone: sellerObj.phone || null,
                email: sellerObj.email || null,
                address: sellerObj.address || null,
                gstNumber: sellerObj.gstNumber || null,
              }
            : null,
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
          const rawLinked = paymentsByParent.get(txId) || [];
          const linkedPayments = rawLinked.map((p: any) => ({
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

          const rawPaid = linkedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
          const paidAmount = Math.round(rawPaid * 100) / 100;
          const remainingDue = Math.max(0, Math.round((baseTx.amount - paidAmount) * 100) / 100);

          baseTx.paidAmount = paidAmount;
          baseTx.remainingDue = remainingDue;
          baseTx.linkedPayments = linkedPayments;
        } else if (tx.type === 'PAYMENT') {
          if (tx.parentId) {
            const parent = parentDeliveryMap.get(tx.parentId.toString());
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
        res.status(400).json({ success: false, error: 'Valid seller ID is required.', message: 'Valid seller ID is required.' });
        return;
      }

      const seller = await SellerModel.findById(sellerId);
      if (!seller) {
        res.status(404).json({ success: false, error: 'Seller not found.', message: 'Seller not found.' });
        return;
      }

      if (!type || !['DELIVERY', 'PAYMENT'].includes(type)) {
        res.status(400).json({ success: false, error: 'Transaction type must be "DELIVERY" or "PAYMENT".', message: 'Transaction type must be "DELIVERY" or "PAYMENT".' });
        return;
      }

      const rawAmount = Number(amount);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        res.status(400).json({ success: false, error: 'Amount must be a positive number.', message: 'Amount must be a positive number.' });
        return;
      }
      const parsedAmount = Math.round(rawAmount * 100) / 100;

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

      const receipt = TransactionController.buildServerReceipt(transaction, seller);

      const formattedTx = {
        id: transaction._id.toString(),
        _id: transaction._id.toString(),
        sellerId: transaction.sellerId.toString(),
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
        receipt,
      };

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully.',
        transaction: formattedTx,
        receipt,
        data: {
          ...formattedTx,
          transaction: formattedTx,
          receipt,
        },
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error recording transaction.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // GET /api/v1/transactions/:id/receipt - Server-generated official receipt
  public static async getTransactionReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.' });
        return;
      }

      const tx = await TransactionModel.findById(id).populate('sellerId').lean();
      if (!tx) {
        res.status(404).json({ success: false, error: 'Transaction not found.' });
        return;
      }

      let seller: any = tx.sellerId;
      if (!seller || typeof seller !== 'object' || !seller.name) {
        seller = await SellerModel.findById(tx.sellerId).lean();
      }
      const receipt = TransactionController.buildServerReceipt(tx, seller);

      res.status(200).json({
        success: true,
        receiptUrl: receipt.pdfUrl,
        data: receipt,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error generating receipt.' });
    }
  }

  // GET /api/v1/transactions/:id/receipt/pdf - Server-generated canonical PDF receipt
  public static async getTransactionReceiptPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.' });
        return;
      }

      const tx = await TransactionModel.findById(id).populate('sellerId').lean();
      if (!tx) {
        res.status(404).json({ success: false, error: 'Transaction not found.' });
        return;
      }

      let seller: any = tx.sellerId;
      if (!seller || typeof seller !== 'object' || !seller.name) {
        seller = await SellerModel.findById(tx.sellerId).lean();
      }

      const pdfBuffer = await PdfReceiptService.generateReceiptPdf(tx as any, seller);
      const receiptNo = `RCP-${tx._id.toString().slice(-8).toUpperCase()}`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Receipt-${receiptNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.status(200).send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error generating receipt PDF.' });
    }
  }

  public static buildServerReceipt(transaction: any, seller: any) {
    const txId = transaction._id ? transaction._id.toString() : (transaction.id || '');
    const isDelivery = String(transaction.type).toUpperCase() === 'DELIVERY';
    const t500 = Number(transaction.tank500) || 0;
    const t1000 = Number(transaction.tank1000) || 0;
    const t2000 = Number(transaction.tank2000) || 0;
    const totalTanks = t500 + t1000 + t2000;

    const items = [];
    if (isDelivery) {
      if (t500 > 0) {
        items.push({
          description: 'Water Storage Tank (Polymer)',
          capacity: '500L',
          quantity: t500,
          unitName: 'Units',
        });
      }
      if (t1000 > 0) {
        items.push({
          description: 'Water Storage Tank (Polymer)',
          capacity: '1000L',
          quantity: t1000,
          unitName: 'Units',
        });
      }
      if (t2000 > 0) {
        items.push({
          description: 'Water Storage Tank (Polymer)',
          capacity: '2000L',
          quantity: t2000,
          unitName: 'Units',
        });
      }
    } else {
      items.push({
        description: `Financial Payment Settlement (${transaction.paymentMode || 'Direct'})`,
        capacity: 'N/A',
        quantity: 1,
        unitName: 'Payment',
      });
    }

    return {
      receiptNo: `RCP-${txId.slice(-8).toUpperCase()}`,
      issueDate: transaction.date || transaction.createdAt || new Date(),
      status: 'CONFIRMED & RECORDED',
      company: {
        name: process.env.COMPANY_NAME || process.env.VITE_COMPANY_NAME || 'Vasudha Polymer',
        gst: process.env.COMPANY_GST || process.env.VITE_COMPANY_GST || '07AAAAA0000A1Z5',
        phone: process.env.COMPANY_PHONE || process.env.VITE_COMPANY_PHONE || '+91 98765 43210',
        address: process.env.COMPANY_ADDRESS || process.env.VITE_COMPANY_ADDRESS || 'Plot 42, Industrial Zone, New Delhi - 110020',
      },
      seller: {
        id: seller ? (seller._id ? seller._id.toString() : (seller.id || '')) : (transaction.sellerId?.toString() || ''),
        name: seller?.name || transaction?.sellerName || 'Valued Vendor',
        phone: seller?.phone || transaction?.sellerPhone || null,
        email: seller?.email || transaction?.sellerEmail || null,
        address: seller?.address || transaction?.sellerAddress || null,
        gstNumber: seller?.gstNumber || transaction?.sellerGstNumber || null,
      },
      transaction: {
        id: txId,
        sellerId: seller ? (seller._id ? seller._id.toString() : (seller.id || '')) : (transaction.sellerId?.toString() || ''),
        parentId: transaction.parentId ? transaction.parentId.toString() : null,
        type: transaction.type,
        amount: Number(transaction.amount) || 0,
        formattedAmount: `₹ ${Number(transaction.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        date: transaction.date,
        note: transaction.note || null,
        paymentMode: transaction.paymentMode || null,
        tank500: t500,
        tank1000: t1000,
        tank2000: t2000,
        totalTanks,
        createdAt: transaction.createdAt,
      },
      items,
      totalUnits: totalTanks,
      pdfUrl: `/api/v1/transactions/${txId}/receipt/pdf`,
    };
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
        const rawAmount = Number(amount);
        if (isNaN(rawAmount) || rawAmount <= 0) {
          res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
          return;
        }
        transaction.amount = Math.round(rawAmount * 100) / 100;
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
      PdfReceiptService.invalidateCache(id);

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

      PdfReceiptService.invalidateCache(id);

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
