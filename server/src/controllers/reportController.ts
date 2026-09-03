import { Request, Response } from 'express';
import { SellerModel } from '../models/Seller';
import { TransactionModel } from '../models/Transaction';

export class ReportController {
  // GET /api/v1/reports/summary
  public static async getSummaryReport(req: Request, res: Response): Promise<void> {
    try {
      const sellers = await SellerModel.find().lean();
      const transactions = await TransactionModel.find().lean();

      let totalBilledSales = 0;
      let totalClearedPayments = 0;

      let tank500Units = 0;
      let tank1000Units = 0;
      let tank2000Units = 0;

      const sellerMetricsMap = new Map<string, { name: string; totalDeliveries: number; totalPaid: number; totalDues: number }>();

      sellers.forEach((s) => {
        sellerMetricsMap.set(s._id.toString(), {
          name: s.name,
          totalDeliveries: 0,
          totalPaid: 0,
          totalDues: 0,
        });
      });

      transactions.forEach((tx) => {
        const sellerIdStr = tx.sellerId.toString();
        const sellerEntry = sellerMetricsMap.get(sellerIdStr);

        if (tx.type === 'DELIVERY') {
          totalBilledSales += tx.amount;
          tank500Units += tx.tank500 || 0;
          tank1000Units += tx.tank1000 || 0;
          tank2000Units += tx.tank2000 || 0;

          if (sellerEntry) {
            sellerEntry.totalDeliveries += tx.amount;
          }
        } else if (tx.type === 'PAYMENT') {
          totalClearedPayments += tx.amount;
          if (sellerEntry) {
            sellerEntry.totalPaid += tx.amount;
          }
        }
      });

      // Calculate dues per seller
      const leaderboards = Array.from(sellerMetricsMap.values()).map((entry) => ({
        ...entry,
        totalDues: entry.totalDeliveries - entry.totalPaid,
      }));

      // Top 3 sellers by total billed sales
      leaderboards.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
      const topSellers = leaderboards.slice(0, 3);

      const totalOutstandingDues = totalBilledSales - totalClearedPayments;
      const collectionEfficiencyRate = totalBilledSales > 0 ? (totalClearedPayments / totalBilledSales) * 100 : 100;

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalSellers: sellers.length,
            totalBilledSales,
            totalClearedPayments,
            totalOutstandingDues,
            collectionEfficiencyRate: Number(collectionEfficiencyRate.toFixed(1)),
          },
          tankBreakdown: {
            tank500: tank500Units,
            tank1000: tank1000Units,
            tank2000: tank2000Units,
          },
          topSellers,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error generating summary report.' });
    }
  }

  // GET /api/v1/reports/tank-summary?month=YYYY-MM or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  public static async getTankSummaryReport(req: Request, res: Response): Promise<void> {
    try {
      const { month, startDate: startParam, endDate: endParam } = req.query;
      const sellers = await SellerModel.find().lean();

      let dateFilter: any = {};
      let periodLabel = 'All Time';
      let effectiveStartDate: string | null = null;
      let effectiveEndDate: string | null = null;

      if (startParam && endParam) {
        const start = new Date(String(startParam));
        const end = new Date(String(endParam));
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          dateFilter = { date: { $gte: start, $lte: end } };
          effectiveStartDate = start.toISOString().split('T')[0];
          effectiveEndDate = end.toISOString().split('T')[0];
          periodLabel = `${effectiveStartDate} to ${effectiveEndDate}`;
        }
      } else if (month && String(month).includes('-')) {
        const [yearStr, monthStr] = String(month).split('-');
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;
        if (!isNaN(year) && !isNaN(monthIndex)) {
          const startDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
          const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
          dateFilter = { date: { $gte: startDate, $lte: endDate } };
          effectiveStartDate = startDate.toISOString().split('T')[0];
          effectiveEndDate = endDate.toISOString().split('T')[0];
          periodLabel = String(month);
        }
      }

      const transactions = await TransactionModel.find({
        type: 'DELIVERY',
        ...dateFilter,
      }).lean();

      const summaryMap = new Map<string, { sellerId: string; sellerName: string; total500: number; total1000: number; total2000: number; totalOrders: number }>();

      sellers.forEach((s) => {
        summaryMap.set(s._id.toString(), {
          sellerId: s._id.toString(),
          sellerName: s.name,
          total500: 0,
          total1000: 0,
          total2000: 0,
          totalOrders: 0,
        });
      });

      transactions.forEach((tx) => {
        const sid = tx.sellerId.toString();
        let entry = summaryMap.get(sid);
        if (!entry) {
          entry = {
            sellerId: sid,
            sellerName: 'Vendor Account',
            total500: 0,
            total1000: 0,
            total2000: 0,
            totalOrders: 0,
          };
          summaryMap.set(sid, entry);
        }

        entry.total500 += tx.tank500 || 0;
        entry.total1000 += tx.tank1000 || 0;
        entry.total2000 += tx.tank2000 || 0;
        entry.totalOrders += (tx.tank500 || 0) + (tx.tank1000 || 0) + (tx.tank2000 || 0);
      });

      const summary = Array.from(summaryMap.values());
      summary.sort((a, b) => b.totalOrders - a.totalOrders);

      res.status(200).json({
        success: true,
        data: {
          period: periodLabel,
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          month: typeof month === 'string' ? month : (periodLabel !== 'All Time' ? periodLabel : 'all'),
          summary,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error generating tank summary report.' });
    }
  }
}
