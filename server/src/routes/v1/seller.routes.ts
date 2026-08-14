import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../../utils/db';
import { authenticateJwt, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all seller routes
router.use(authenticateJwt);

// GET /api/v1/sellers - List all sellers with server-side SQL computed totals
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rawSellers = await query<any[]>(`
      SELECT 
        s.id, s.name, s.email, s.phone, s.address, s.gstNumber, s.createdAt, s.updatedAt,
        COALESCE(SUM(CASE WHEN UPPER(t.type) = 'DELIVERY' THEN t.amount ELSE 0 END), 0) AS totalDeliveries,
        COALESCE(SUM(CASE WHEN UPPER(t.type) = 'PAYMENT' THEN t.amount ELSE 0 END), 0) AS totalPaid,
        COUNT(t.id) AS transactionCount
      FROM Seller s
      LEFT JOIN Transaction t ON s.id = t.sellerId
      GROUP BY s.id
      ORDER BY s.createdAt DESC
    `);

    const formattedSellers = rawSellers.map((seller) => {
      const deliveries = Number(seller.totalDeliveries) || 0;
      const paid = Number(seller.totalPaid) || 0;
      const dues = deliveries - paid;

      return {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        address: seller.address,
        gstNumber: seller.gstNumber,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
        totalDeliveries: Number(deliveries.toFixed(2)),
        totalPaid: Number(paid.toFixed(2)),
        totalDues: Number(dues.toFixed(2)),
        transactionCount: Number(seller.transactionCount) || 0,
      };
    });

    const summary = formattedSellers.reduce(
      (acc, s) => {
        acc.totalDeliveries += s.totalDeliveries;
        acc.totalPaid += s.totalPaid;
        acc.totalDues += s.totalDues;
        return acc;
      },
      { totalDeliveries: 0, totalPaid: 0, totalDues: 0 }
    );

    return res.json({
      success: true,
      data: {
        sellers: formattedSellers,
        summary: {
          totalSellers: formattedSellers.length,
          totalDeliveries: Number(summary.totalDeliveries.toFixed(2)),
          totalPaid: Number(summary.totalPaid.toFixed(2)),
          totalDues: Number(summary.totalDues.toFixed(2)),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching sellers:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve sellers',
    });
  }
});

// POST /api/v1/sellers - Create new seller
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, address, gstNumber } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Seller name is required',
      });
    }

    const sellerId = randomUUID();
    const cleanName = name.trim();
    const cleanEmail = email ? email.trim() : null;
    const cleanPhone = phone ? phone.trim() : null;
    const cleanAddress = address ? address.trim() : null;
    const cleanGst = gstNumber ? gstNumber.trim() : null;

    await query(
      'INSERT INTO Seller (id, name, email, phone, address, gstNumber) VALUES (?, ?, ?, ?, ?, ?)',
      [sellerId, cleanName, cleanEmail, cleanPhone, cleanAddress, cleanGst]
    );

    const createdSellers = await query<any[]>('SELECT * FROM Seller WHERE id = ?', [sellerId]);
    const newSeller = createdSellers[0];

    return res.status(201).json({
      success: true,
      message: 'Seller created successfully',
      data: {
        seller: {
          ...newSeller,
          totalDeliveries: 0,
          totalPaid: 0,
          totalDues: 0,
          transactionCount: 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating seller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create seller',
    });
  }
});

// GET /api/v1/sellers/:id - Get single seller with delivery orders & associated payments
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sellers = await query<any[]>('SELECT * FROM Seller WHERE id = ? LIMIT 1', [id]);
    if (!sellers || sellers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    const seller = sellers[0];
    const transactions = await query<any[]>(
      'SELECT * FROM Transaction WHERE sellerId = ? ORDER BY date DESC',
      [id]
    );

    let totalDeliveries = 0;
    let totalPaid = 0;

    transactions.forEach((tx) => {
      if (String(tx.type).toUpperCase() === 'DELIVERY') {
        totalDeliveries += Number(tx.amount);
      } else if (String(tx.type).toUpperCase() === 'PAYMENT') {
        totalPaid += Number(tx.amount);
      }
    });

    // Map payments to deliveries if linked via parentId
    const formattedTransactions = transactions.map((tx) => {
      const isDelivery = String(tx.type).toUpperCase() === 'DELIVERY';

      if (isDelivery) {
        // Find all payments linked to this specific delivery order
        const linkedPayments = transactions.filter(
          (p) => String(p.type).toUpperCase() === 'PAYMENT' && p.parentId === tx.id
        );
        const paidAmount = linkedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingDue = Number(tx.amount) - paidAmount;

        return {
          ...tx,
          amount: Number(tx.amount),
          tank500: Number(tx.tank500) || 0,
          tank1000: Number(tx.tank1000) || 0,
          tank2000: Number(tx.tank2000) || 0,
          paidAmount: Number(paidAmount.toFixed(2)),
          remainingDue: Number(remainingDue.toFixed(2)),
          linkedPayments: linkedPayments.map((lp) => ({ ...lp, amount: Number(lp.amount) })),
        };
      }

      return {
        ...tx,
        amount: Number(tx.amount),
        tank500: Number(tx.tank500) || 0,
        tank1000: Number(tx.tank1000) || 0,
        tank2000: Number(tx.tank2000) || 0,
      };
    });

    const totalDues = totalDeliveries - totalPaid;

    return res.json({
      success: true,
      data: {
        seller: {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          address: seller.address,
          gstNumber: seller.gstNumber,
          createdAt: seller.createdAt,
          updatedAt: seller.updatedAt,
          totalDeliveries: Number(totalDeliveries.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          totalDues: Number(totalDues.toFixed(2)),
          transactions: formattedTransactions,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching seller details:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve seller details',
    });
  }
});

// DELETE /api/v1/sellers/:id - Delete a seller
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sellers = await query<any[]>('SELECT id FROM Seller WHERE id = ? LIMIT 1', [id]);
    if (!sellers || sellers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    await query('DELETE FROM Seller WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Seller deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting seller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete seller',
    });
  }
});

export default router;
