import { Router, Response } from 'express';
import { query } from '../../utils/db';
import { authenticateJwt, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware
router.use(authenticateJwt);

/**
 * GET /api/v1/reports/tank-summary?month=YYYY-MM
 * Returns per-seller tank order totals for the selected month,
 * sorted by total tank orders descending.
 */
router.get('/tank-summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Default to current month if not provided
    const monthParam = req.query.month as string | undefined;
    let monthFilter: string;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      monthFilter = monthParam;
    } else {
      const now = new Date();
      monthFilter = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const rows = await query<any[]>(
      `
      SELECT
        s.id         AS sellerId,
        s.name       AS sellerName,
        COALESCE(SUM(t.tank500),  0) AS total500,
        COALESCE(SUM(t.tank1000), 0) AS total1000,
        COALESCE(SUM(t.tank2000), 0) AS total2000,
        COALESCE(SUM(t.tank500 + t.tank1000 + t.tank2000), 0) AS totalOrders
      FROM Seller s
      LEFT JOIN Transaction t
        ON  t.sellerId = s.id
        AND UPPER(t.type) = 'DELIVERY'
        AND DATE_FORMAT(t.date, '%Y-%m') = ?
      GROUP BY s.id, s.name
      ORDER BY totalOrders DESC, s.name ASC
      `,
      [monthFilter]
    );

    const data = rows.map((r) => ({
      sellerId:    r.sellerId,
      sellerName:  r.sellerName,
      total500:    Number(r.total500),
      total1000:   Number(r.total1000),
      total2000:   Number(r.total2000),
      totalOrders: Number(r.totalOrders),
    }));

    return res.json({
      success: true,
      data: {
        month:   monthFilter,
        summary: data,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tank summary report:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate tank summary report',
    });
  }
});

export default router;
