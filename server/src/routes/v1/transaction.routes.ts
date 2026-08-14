import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../../utils/db';
import { authenticateJwt, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all transaction routes
router.use(authenticateJwt);

// GET /api/v1/transactions - List transactions
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sellerId } = req.query;

    let sql = `
      SELECT 
        t.*, 
        s.name AS sellerName,
        p.note AS parentNote,
        p.amount AS parentAmount,
        p.date AS parentDate
      FROM Transaction t 
      JOIN Seller s ON t.sellerId = s.id 
      LEFT JOIN Transaction p ON t.parentId = p.id
    `;
    const params: any[] = [];

    if (sellerId) {
      sql += ' WHERE t.sellerId = ? ';
      params.push(String(sellerId));
    }

    sql += ' ORDER BY t.date DESC ';

    const rawTx = await query<any[]>(sql, params);
    const transactions = rawTx.map((t) => ({
      id: t.id,
      sellerId: t.sellerId,
      parentId: t.parentId || null,
      type: t.type,
      amount: Number(t.amount),
      date: t.date,
      note: t.note,
      tank500: Number(t.tank500) || 0,
      tank1000: Number(t.tank1000) || 0,
      tank2000: Number(t.tank2000) || 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      seller: { id: t.sellerId, name: t.sellerName },
      parentDelivery: t.parentId
        ? {
            id: t.parentId,
            note: t.parentNote,
            amount: Number(t.parentAmount),
            date: t.parentDate,
          }
        : null,
    }));

    return res.json({
      success: true,
      data: { transactions },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transactions',
    });
  }
});

// POST /api/v1/transactions - Add a transaction (supports linking PAYMENT to a DELIVERY order)
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sellerId, parentId, type, amount, date, note, tank500, tank1000, tank2000 } = req.body;

    if (!sellerId || !type || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'sellerId, type (DELIVERY | PAYMENT), and amount are required',
      });
    }

    const normalizedType = String(type).toUpperCase();
    if (normalizedType !== 'DELIVERY' && normalizedType !== 'PAYMENT') {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either DELIVERY or PAYMENT',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Verify seller exists
    const sellers = await query<any[]>('SELECT id FROM Seller WHERE id = ? LIMIT 1', [sellerId]);
    if (!sellers || sellers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Associated seller not found',
      });
    }

    // Verify parent delivery transaction if parentId provided
    let cleanParentId: string | null = null;
    if (parentId && normalizedType === 'PAYMENT') {
      const parents = await query<any[]>(
        'SELECT id, type, sellerId FROM Transaction WHERE id = ? LIMIT 1',
        [parentId]
      );
      if (parents && parents.length > 0 && parents[0].sellerId === sellerId) {
        cleanParentId = parents[0].id;
      }
    }

    const txId = randomUUID();
    const txDate = date ? new Date(date) : new Date();
    const cleanNote = note ? String(note).trim() : null;
    const cleanTank500 = normalizedType === 'DELIVERY' ? Math.max(0, parseInt(String(tank500 || 0), 10) || 0) : 0;
    const cleanTank1000 = normalizedType === 'DELIVERY' ? Math.max(0, parseInt(String(tank1000 || 0), 10) || 0) : 0;
    const cleanTank2000 = normalizedType === 'DELIVERY' ? Math.max(0, parseInt(String(tank2000 || 0), 10) || 0) : 0;

    await query(
      'INSERT INTO Transaction (id, sellerId, parentId, type, amount, date, note, tank500, tank1000, tank2000) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [txId, sellerId, cleanParentId, normalizedType, numericAmount, txDate, cleanNote, cleanTank500, cleanTank1000, cleanTank2000]
    );

    const createdTxs = await query<any[]>('SELECT * FROM Transaction WHERE id = ?', [txId]);
    const transaction = createdTxs[0];

    // Recompute seller totals to return updated state
    const allTransactions = await query<any[]>(
      'SELECT type, amount FROM Transaction WHERE sellerId = ?',
      [sellerId]
    );

    let totalDeliveries = 0;
    let totalPaid = 0;

    allTransactions.forEach((tx) => {
      if (String(tx.type).toUpperCase() === 'DELIVERY') {
        totalDeliveries += Number(tx.amount);
      } else if (String(tx.type).toUpperCase() === 'PAYMENT') {
        totalPaid += Number(tx.amount);
      }
    });

    const totalDues = totalDeliveries - totalPaid;

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: {
        transaction,
        sellerTotals: {
          totalDeliveries: Number(totalDeliveries.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          totalDues: Number(totalDues.toFixed(2)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record transaction',
    });
  }
});

// DELETE /api/v1/transactions/:id - Delete a transaction
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingTx = await query<any[]>('SELECT sellerId FROM Transaction WHERE id = ? LIMIT 1', [id]);
    if (!existingTx || existingTx.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const sellerId = existingTx[0].sellerId;
    await query('DELETE FROM Transaction WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { sellerId },
    });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete transaction',
    });
  }
});

export default router;
