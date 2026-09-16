import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TransactionModel } from '../models/Transaction';
import { SellerModel } from '../models/Seller';
import { PdfReceiptService } from '../services/pdfReceiptService';
import { env } from '../config/env';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
        const cleanSearch = search.trim().slice(0, 100);
        const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');
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

        if (mongoose.Types.ObjectId.isValid(cleanSearch)) {
          searchConditions.push({ _id: new mongoose.Types.ObjectId(cleanSearch) });
        }

        filter.$or = searchConditions;
      }

      const totalCount = await TransactionModel.countDocuments(filter);

      // Safe bounded pagination with default and max limits
      const pageNum = Math.max(1, parseInt(String(page || 1), 10) || 1);
      const rawLimit = limit !== undefined ? parseInt(String(limit), 10) : (page !== undefined ? 10 : 50);
      const limitNum = Math.max(1, Math.min(rawLimit || 50, 100));
      const skip = (pageNum - 1) * limitNum;

      const transactions = await TransactionModel.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('sellerId', 'name email phone address gstNumber')
        .lean();

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
          previousDues: tx.previousDues !== undefined && tx.previousDues !== null ? Math.round(Number(tx.previousDues) * 100) / 100 : 0,
          currentDues: Math.round(((tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) + (tx.type === 'DELIVERY' ? tx.amount : -tx.amount)) * 100) / 100,
          isPreviousAdvance: (tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) < 0,
          isCurrentAdvance: Math.round(((tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) + (tx.type === 'DELIVERY' ? tx.amount : -tx.amount)) * 100) / 100 < 0,
          previousDuesFormatted: (tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) < 0
            ? `+ ₹ ${Math.abs(Number(tx.previousDues)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `₹ ${Math.abs(tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          currentDuesFormatted: Math.round(((tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) + (tx.type === 'DELIVERY' ? tx.amount : -tx.amount)) * 100) / 100 < 0
            ? `+ ₹ ${Math.abs(Math.round(((tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) + (tx.type === 'DELIVERY' ? tx.amount : -tx.amount)) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `₹ ${Math.abs(Math.round(((tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0) + (tx.type === 'DELIVERY' ? tx.amount : -tx.amount)) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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

          const prevDues = tx.previousDues !== undefined && tx.previousDues !== null ? Number(tx.previousDues) : 0;
          const advanceCredit = Math.max(0, -prevDues);
          const rawPaid = linkedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
          const paidAmount = Math.round(rawPaid * 100) / 100;
          const remainingDue = Math.max(0, Math.round((baseTx.amount - advanceCredit - paidAmount) * 100) / 100);

          baseTx.advanceCredit = advanceCredit;
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

      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      res.status(200).json({
        success: true,
        data: {
          transactions: formatted,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error fetching transactions.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // POST /api/v1/transactions
  public static async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const {
        sellerId,
        parentId,
        type,
        amount,
        note,
        tankItems,
        tank500,
        tank1000,
        tank2000,
        tank500_layers,
        tank1000_layers,
        tank1000_foam,
        paymentMode,
        date,
      } = req.body;

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

      // Strictly reject 2000L tanks
      if (tank2000 !== undefined && Number(tank2000) > 0) {
        res.status(400).json({
          success: false,
          error: '2000L tanks are no longer supported. Only 500L and 1000L tanks are permitted.',
          message: '2000L tanks are no longer supported. Only 500L and 1000L tanks are permitted.',
        });
        return;
      }

      const rawAmount = Number(amount);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        res.status(400).json({ success: false, error: 'Amount must be a positive number.', message: 'Amount must be a positive number.' });
        return;
      }
      const parsedAmount = Math.round(rawAmount * 100) / 100;

      let validatedTankItems: any[] = [];
      let qty500 = 0;
      let qty1000 = 0;
      let parsed500Layers: number | null = null;
      let parsed1000Layers: number | null = null;
      let parsed1000Foam: 'none' | 'single' | 'double' = 'none';

      if (type === 'DELIVERY') {
        if (Array.isArray(tankItems) && tankItems.length > 0) {
          for (let i = 0; i < tankItems.length; i++) {
            const item = tankItems[i];
            const size = Number(item.size);
            if (![500, 1000].includes(size)) {
              res.status(400).json({
                success: false,
                error: `Tank Variant #${i + 1}: Tank size must be 500 or 1000. 2000L tanks are not supported.`,
                message: `Tank Variant #${i + 1}: Tank size must be 500 or 1000. 2000L tanks are not supported.`,
              });
              return;
            }

            const qty = Number(item.quantity);
            if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
              res.status(400).json({
                success: false,
                error: `Tank Variant #${i + 1}: Please enter a valid quantity greater than 0.`,
                message: `Tank Variant #${i + 1}: Please enter a valid quantity greater than 0.`,
              });
              return;
            }

            const layers = Number(item.layers);
            if (isNaN(layers) || !Number.isInteger(layers) || layers < 3 || layers > 6) {
              res.status(400).json({
                success: false,
                error: `Tank Variant #${i + 1}: Layers must be an integer between 3 and 6.`,
                message: `Tank Variant #${i + 1}: Layers must be an integer between 3 and 6.`,
              });
              return;
            }

            let foam: 'none' | 'single' | 'double' = 'none';
            if (size === 1000 && item.foam !== undefined && item.foam !== null) {
              const fStr = String(item.foam).trim().toLowerCase();
              if (!['none', 'single', 'double'].includes(fStr)) {
                res.status(400).json({
                  success: false,
                  error: `Tank Variant #${i + 1}: Foam type for 1000L tank must be 'none', 'single', or 'double'.`,
                  message: `Tank Variant #${i + 1}: Foam type for 1000L tank must be 'none', 'single', or 'double'.`,
                });
                return;
              }
              foam = fStr as any;
            } else if (size === 500 && item.foam && String(item.foam).trim().toLowerCase() !== 'none') {
              res.status(400).json({
                success: false,
                error: `Tank Variant #${i + 1}: Foam type is only applicable for 1000L tanks.`,
                message: `Tank Variant #${i + 1}: Foam type is only applicable for 1000L tanks.`,
              });
              return;
            }

            validatedTankItems.push({
              size,
              quantity: qty,
              layers,
              foam: size === 1000 ? foam : 'none',
            });

            if (size === 500) {
              qty500 += qty;
              parsed500Layers = layers;
            } else if (size === 1000) {
              qty1000 += qty;
              parsed1000Layers = layers;
              parsed1000Foam = foam;
            }
          }
        } else {
          qty500 = Number(tank500) || 0;
          qty1000 = Number(tank1000) || 0;

          if (qty500 > 0) {
            let l500 = 4;
            if (tank500_layers !== undefined && tank500_layers !== null && String(tank500_layers).trim() !== '') {
              const parsed = Number(tank500_layers);
              if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 3 || parsed > 6) {
                res.status(400).json({
                  success: false,
                  error: 'Tank 500L layers must be an integer between 3 and 6.',
                  message: 'Tank 500L layers must be an integer between 3 and 6.',
                });
                return;
              }
              l500 = parsed;
            }
            parsed500Layers = l500;
            validatedTankItems.push({
              size: 500,
              quantity: qty500,
              layers: parsed500Layers,
              foam: 'none',
            });
          }

          if (qty1000 > 0) {
            let l1000 = 4;
            if (tank1000_layers !== undefined && tank1000_layers !== null && String(tank1000_layers).trim() !== '') {
              const parsed = Number(tank1000_layers);
              if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 3 || parsed > 6) {
                res.status(400).json({
                  success: false,
                  error: 'Tank 1000L layers must be an integer between 3 and 6.',
                  message: 'Tank 1000L layers must be an integer between 3 and 6.',
                });
                return;
              }
              l1000 = parsed;
            }
            parsed1000Layers = l1000;

            if (tank1000_foam !== undefined && tank1000_foam !== null) {
              const foamStr = String(tank1000_foam).trim().toLowerCase();
              if (!['none', 'single', 'double'].includes(foamStr)) {
                res.status(400).json({
                  success: false,
                  error: "Foam type for 1000L tank must be 'none', 'single', or 'double'.",
                  message: "Foam type for 1000L tank must be 'none', 'single', or 'double'.",
                });
                return;
              }
              parsed1000Foam = foamStr as any;
            }

            validatedTankItems.push({
              size: 1000,
              quantity: qty1000,
              layers: parsed1000Layers,
              foam: parsed1000Foam,
            });
          }
        }
      }

      const sellerTotals = await TransactionModel.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
        {
          $group: {
            _id: null,
            totalDeliveries: { $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$amount', 0] } },
            totalPaid: { $sum: { $cond: [{ $eq: ['$type', 'PAYMENT'] }, '$amount', 0] } },
          },
        },
      ]);
      const prevDeliv = sellerTotals[0]?.totalDeliveries || 0;
      const prevPaid = sellerTotals[0]?.totalPaid || 0;
      const previousDues = Math.round((prevDeliv - prevPaid) * 100) / 100;
      const currentDues = Math.round(
        (type === 'DELIVERY' ? previousDues + parsedAmount : previousDues - parsedAmount) * 100
      ) / 100;

      const transaction = await TransactionModel.create({
        sellerId: new mongoose.Types.ObjectId(sellerId),
        parentId: parentId && mongoose.Types.ObjectId.isValid(parentId) ? new mongoose.Types.ObjectId(parentId) : null,
        type,
        amount: parsedAmount,
        date: (() => {
          const rawDate = date ? new Date(date) : new Date();
          return isNaN(rawDate.getTime())
            ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
            : new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));
        })(),
        note: note ? String(note).trim() : null,
        tankItems: validatedTankItems.length > 0 ? validatedTankItems : undefined,
        tank500: qty500,
        tank1000: qty1000,
        tank500_layers: parsed500Layers,
        tank1000_layers: parsed1000Layers,
        tank1000_foam: parsed1000Foam,
        previousDues,
        paymentMode: type === 'PAYMENT' ? (paymentMode ? String(paymentMode).trim() : null) : null,
      });

      const receipt = TransactionController.buildServerReceipt(transaction, seller, previousDues, currentDues);

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
        previousDues,
        currentDues,
        date: transaction.date,
        note: transaction.note || null,
        tankItems: transaction.tankItems || validatedTankItems,
        tank500: transaction.tank500 || 0,
        tank1000: transaction.tank1000 || 0,
        tank500_layers: transaction.tank500_layers || null,
        tank1000_layers: transaction.tank1000_layers || null,
        tank1000_foam: transaction.tank1000_foam || 'none',
        paymentMode: transaction.paymentMode || null,
        createdAt: transaction.createdAt,
        receipt,
      };

      // Construct stable public HTTPS receipt URL
      const hostUrl = env.PUBLIC_URL || `${req.protocol}://${req.get('host')}/api/v1`;
      const publicPdfUrl = `${hostUrl}/transactions/${transaction._id.toString()}/receipt/pdf`;

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully.',
        transaction: formattedTx,
        receipt,
        receiptUrl: publicPdfUrl,
        data: {
          ...formattedTx,
          transaction: formattedTx,
          receipt,
          receiptUrl: publicPdfUrl,
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
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.', message: 'Invalid transaction ID format.' });
        return;
      }

      const tx = await TransactionModel.findById(id).populate('sellerId').lean();
      if (!tx) {
        res.status(404).json({ success: false, error: 'Transaction not found.', message: 'Transaction not found.' });
        return;
      }

      let seller: any = tx.sellerId;
      if (!seller || typeof seller !== 'object' || !seller.name) {
        seller = await SellerModel.findById(tx.sellerId).lean();
      }

      let previousDues = tx.previousDues;
      if (previousDues === undefined || previousDues === null) {
        const priorTotals = await TransactionModel.aggregate([
          {
            $match: {
              sellerId: tx.sellerId && typeof tx.sellerId === 'object' ? (tx.sellerId as any)._id : tx.sellerId,
              $or: [
                { date: { $lt: tx.date } },
                { date: tx.date, createdAt: { $lt: tx.createdAt } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              deliv: { $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$amount', 0] } },
              paid: { $sum: { $cond: [{ $eq: ['$type', 'PAYMENT'] }, '$amount', 0] } },
            },
          },
        ]);
        previousDues = Math.round(((priorTotals[0]?.deliv || 0) - (priorTotals[0]?.paid || 0)) * 100) / 100;
      }
      const currentDues = Math.round(
        (tx.type === 'DELIVERY' ? previousDues + tx.amount : previousDues - tx.amount) * 100
      ) / 100;

      const receipt = TransactionController.buildServerReceipt(tx, seller, previousDues, currentDues);

      res.status(200).json({
        success: true,
        receiptUrl: receipt.pdfUrl,
        data: receipt,
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error generating receipt.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // GET /api/v1/transactions/:id/receipt/pdf - Server-generated canonical PDF receipt
  public static async getTransactionReceiptPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.', message: 'Invalid transaction ID format.' });
        return;
      }

      const tx = await TransactionModel.findById(id).populate('sellerId').lean();
      if (!tx) {
        res.status(404).json({ success: false, error: 'Transaction not found.', message: 'Transaction not found.' });
        return;
      }

      let seller: any = tx.sellerId;
      if (!seller || typeof seller !== 'object' || !seller.name) {
        seller = await SellerModel.findById(tx.sellerId).lean();
      }

      let previousDues = tx.previousDues;
      if (previousDues === undefined || previousDues === null) {
        const priorTotals = await TransactionModel.aggregate([
          {
            $match: {
              sellerId: tx.sellerId && typeof tx.sellerId === 'object' ? (tx.sellerId as any)._id : tx.sellerId,
              $or: [
                { date: { $lt: tx.date } },
                { date: tx.date, createdAt: { $lt: tx.createdAt } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              deliv: { $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$amount', 0] } },
              paid: { $sum: { $cond: [{ $eq: ['$type', 'PAYMENT'] }, '$amount', 0] } },
            },
          },
        ]);
        previousDues = Math.round(((priorTotals[0]?.deliv || 0) - (priorTotals[0]?.paid || 0)) * 100) / 100;
      }
      const currentDues = Math.round(
        (tx.type === 'DELIVERY' ? previousDues + tx.amount : previousDues - tx.amount) * 100
      ) / 100;

      (tx as any).previousDues = previousDues;
      (tx as any).currentDues = currentDues;

      const includeDues = req.query.includeDues !== 'false' && req.query.includeDues !== '0';
      const pdfBuffer = await PdfReceiptService.generateReceiptPdf(tx as any, seller, includeDues);
      const receiptNo = `RCP-${tx._id.toString().slice(-8).toUpperCase()}`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Receipt-${receiptNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).send(pdfBuffer);
    } catch (error: any) {
      const errMsg = error.message || 'Error generating receipt PDF.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // POST /api/v1/transactions/:id/send-receipt
  // POST /api/v1/transactions/:id/whatsapp
  public static async sendWhatsAppReceipt(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: false,
      message: 'Messaging service integration is deferred for a separate dedicated release.',
    });
  }

  public static buildServerReceipt(transaction: any, seller: any, prevDuesParam?: number, currDuesParam?: number) {
    const txId = transaction._id ? transaction._id.toString() : (transaction.id || '');
    const isDelivery = String(transaction.type).toUpperCase() === 'DELIVERY';
    const t500 = Number(transaction.tank500) || 0;
    const t1000 = Number(transaction.tank1000) || 0;
    const totalTanks = t500 + t1000;

    const previousDues = prevDuesParam !== undefined
      ? prevDuesParam
      : (transaction.previousDues !== undefined ? Number(transaction.previousDues) : 0);
    const currentDues = currDuesParam !== undefined
      ? currDuesParam
      : (transaction.currentDues !== undefined
          ? Number(transaction.currentDues)
          : (isDelivery ? previousDues + (Number(transaction.amount) || 0) : previousDues - (Number(transaction.amount) || 0)));

    const items = [];
    if (isDelivery) {
      if (Array.isArray(transaction.tankItems) && transaction.tankItems.length > 0) {
        for (const item of transaction.tankItems) {
          items.push({
            description: 'Water Storage Tank (Polymer)',
            capacity: `${item.size}L`,
            quantity: item.quantity,
            layers: item.layers || null,
            foam: item.size === 1000 ? (item.foam || 'none') : undefined,
            unitName: 'Units',
          });
        }
      } else {
        if (t500 > 0) {
          items.push({
            description: 'Water Storage Tank (Polymer)',
            capacity: '500L',
            quantity: t500,
            layers: transaction.tank500_layers || null,
            unitName: 'Units',
          });
        }
        if (t1000 > 0) {
          items.push({
            description: 'Water Storage Tank (Polymer)',
            capacity: '1000L',
            quantity: t1000,
            layers: transaction.tank1000_layers || null,
            foam: transaction.tank1000_foam || 'none',
            unitName: 'Units',
          });
        }
      }
    } else {
      items.push({
        description: `Financial Payment Settlement (${transaction.paymentMode || 'Direct'})`,
        capacity: 'N/A',
        quantity: 1,
        unitName: 'Payment',
      });
    }

    const orderDate = transaction.date || transaction.createdAt || new Date();
    return {
      receiptNo: `RCP-${txId.slice(-8).toUpperCase()}`,
      issueDate: orderDate,
      orderDate: orderDate,
      status: 'CONFIRMED & RECORDED',
      company: {
        name: env.COMPANY_NAME,
        gst: env.COMPANY_GST,
        phone: env.COMPANY_PHONE,
        address: env.COMPANY_ADDRESS,
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
        previousDues: Math.round(previousDues * 100) / 100,
        formattedPreviousDues: Math.round(previousDues * 100) / 100 < 0
          ? `+ ₹ ${Math.abs(Math.round(previousDues * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `₹ ${Math.abs(Math.round(previousDues * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        currentDues: Math.round(currentDues * 100) / 100,
        formattedCurrentDues: Math.round(currentDues * 100) / 100 < 0
          ? `+ ₹ ${Math.abs(Math.round(currentDues * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `₹ ${Math.abs(Math.round(currentDues * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isPreviousAdvance: previousDues < 0,
        isCurrentAdvance: currentDues < 0,
        date: transaction.date,
        note: transaction.note || null,
        paymentMode: transaction.paymentMode || null,
        tankItems: transaction.tankItems || undefined,
        tank500: t500,
        tank1000: t1000,
        tank500_layers: transaction.tank500_layers || null,
        tank1000_layers: transaction.tank1000_layers || null,
        tank1000_foam: transaction.tank1000_foam || 'none',
        totalTanks,
        createdAt: transaction.createdAt,
      },
      items,
      totalUnits: totalTanks,
      previousDues: Math.round(previousDues * 100) / 100,
      currentDues: Math.round(currentDues * 100) / 100,
      pdfUrl: `/api/v1/transactions/${txId}/receipt/pdf`,
    };
  }

  // PUT /api/v1/transactions/:id
  public static async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        amount,
        date,
        note,
        tankItems,
        tank500,
        tank1000,
        tank2000,
        tank500_layers,
        tank1000_layers,
        tank1000_foam,
        paymentMode,
        previousDues,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.', message: 'Invalid transaction ID format.' });
        return;
      }

      const transaction = await TransactionModel.findById(id);
      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction record not found.', message: 'Transaction record not found.' });
        return;
      }

      if (tank2000 !== undefined && Number(tank2000) > 0) {
        res.status(400).json({ success: false, error: '2000L tanks are no longer supported.', message: '2000L tanks are no longer supported.' });
        return;
      }

      if (amount !== undefined) {
        const rawAmount = Number(amount);
        if (isNaN(rawAmount) || rawAmount <= 0) {
          res.status(400).json({ success: false, error: 'Amount must be a positive number.', message: 'Amount must be a positive number.' });
          return;
        }
        transaction.amount = Math.round(rawAmount * 100) / 100;
      }

      if (date !== undefined) transaction.date = new Date(date);
      if (note !== undefined) transaction.note = note ? String(note).trim() : undefined;

      if (transaction.type === 'DELIVERY') {
        if (Array.isArray(tankItems)) {
          let validated: any[] = [];
          let q500 = 0;
          let q1000 = 0;
          for (let i = 0; i < tankItems.length; i++) {
            const item = tankItems[i];
            const size = Number(item.size);
            if (![500, 1000].includes(size)) {
              res.status(400).json({ success: false, error: `Tank Variant #${i + 1}: Tank size must be 500 or 1000. 2000L tanks are not supported.`, message: `Tank Variant #${i + 1}: Tank size must be 500 or 1000. 2000L tanks are not supported.` });
              return;
            }
            const qty = Number(item.quantity);
            if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
              res.status(400).json({ success: false, error: `Tank Variant #${i + 1}: Please enter a valid quantity greater than 0.`, message: `Tank Variant #${i + 1}: Please enter a valid quantity greater than 0.` });
              return;
            }
            const layers = Number(item.layers);
            if (isNaN(layers) || !Number.isInteger(layers) || layers < 3 || layers > 6) {
              res.status(400).json({ success: false, error: `Tank Variant #${i + 1}: Layers must be an integer between 3 and 6.`, message: `Tank Variant #${i + 1}: Layers must be an integer between 3 and 6.` });
              return;
            }
            const foam = size === 1000 && item.foam ? String(item.foam).toLowerCase() : 'none';
            validated.push({ size, quantity: qty, layers, foam });
            if (size === 500) q500 += qty;
            if (size === 1000) q1000 += qty;
          }
          transaction.tankItems = validated as any;
          transaction.tank500 = q500;
          transaction.tank1000 = q1000;
        } else {
          const qty500 = tank500 !== undefined ? Number(tank500) || 0 : transaction.tank500;
          const qty1000 = tank1000 !== undefined ? Number(tank1000) || 0 : transaction.tank1000;

          transaction.tank500 = qty500;
          transaction.tank1000 = qty1000;

          if (qty500 > 0) {
            const l500 = tank500_layers !== undefined ? Number(tank500_layers) : transaction.tank500_layers;
            if (l500 === undefined || l500 === null || isNaN(l500) || !Number.isInteger(l500) || l500 < 3 || l500 > 6) {
              res.status(400).json({ success: false, error: 'Tank 500L layers must be an integer between 3 and 6.', message: 'Tank 500L layers must be an integer between 3 and 6.' });
              return;
            }
            transaction.tank500_layers = l500;
          } else {
            transaction.tank500_layers = null;
          }

          if (qty1000 > 0) {
            const l1000 = tank1000_layers !== undefined ? Number(tank1000_layers) : transaction.tank1000_layers;
            if (l1000 === undefined || l1000 === null || isNaN(l1000) || !Number.isInteger(l1000) || l1000 < 3 || l1000 > 6) {
              res.status(400).json({ success: false, error: 'Tank 1000L layers must be an integer between 3 and 6.', message: 'Tank 1000L layers must be an integer between 3 and 6.' });
              return;
            }
            transaction.tank1000_layers = l1000;

            if (tank1000_foam !== undefined) {
              const foamStr = String(tank1000_foam).trim().toLowerCase();
              if (!['none', 'single', 'double'].includes(foamStr)) {
                res.status(400).json({ success: false, error: "Foam type for 1000L tank must be 'none', 'single', or 'double'.", message: "Foam type for 1000L tank must be 'none', 'single', or 'double'." });
                return;
              }
              transaction.tank1000_foam = foamStr as any;
            }
          } else {
            transaction.tank1000_layers = null;
            transaction.tank1000_foam = 'none';
          }
        }
      } else if (transaction.type === 'PAYMENT') {
        if (paymentMode !== undefined) transaction.paymentMode = paymentMode ? String(paymentMode).trim() : undefined;
      }

      // Backdues are strictly computed and immutable; manual override is prohibited

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
            previousDues: transaction.previousDues || 0,
            date: transaction.date,
            note: transaction.note || null,
            tankItems: transaction.tankItems || [],
            tank500: transaction.tank500 || 0,
            tank1000: transaction.tank1000 || 0,
            tank500_layers: transaction.tank500_layers || null,
            tank1000_layers: transaction.tank1000_layers || null,
            tank1000_foam: transaction.tank1000_foam || 'none',
            paymentMode: transaction.paymentMode || null,
            updatedAt: transaction.updatedAt,
          },
        },
      });
    } catch (error: any) {
      const errMsg = error.message || 'Error updating transaction.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }

  // DELETE /api/v1/transactions/:id (Admin only)
  public static async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid transaction ID format.', message: 'Invalid transaction ID format.' });
        return;
      }

      const tx = await TransactionModel.findByIdAndDelete(id);
      if (!tx) {
        res.status(404).json({ success: false, error: 'Transaction record not found.', message: 'Transaction record not found.' });
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
      const errMsg = error.message || 'Error deleting transaction.';
      res.status(500).json({ success: false, error: errMsg, message: errMsg });
    }
  }
}
