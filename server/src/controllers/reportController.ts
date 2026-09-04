import { Request, Response } from 'express';
import { SellerModel } from '../models/Seller';
import { TransactionModel } from '../models/Transaction';

export class ReportController {
  // GET /api/v1/reports/summary
  public static async getSummaryReport(req: Request, res: Response): Promise<void> {
    try {
      const [totalsAgg, topDeliveriesAgg, totalSellers] = await Promise.all([
        TransactionModel.aggregate([
          {
            $group: {
              _id: null,
              totalBilledSales: {
                $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$amount', 0] },
              },
              totalClearedPayments: {
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
        TransactionModel.aggregate([
          {
            $group: {
              _id: '$sellerId',
              totalDeliveries: {
                $sum: { $cond: [{ $eq: ['$type', 'DELIVERY'] }, '$amount', 0] },
              },
              totalPaid: {
                $sum: { $cond: [{ $eq: ['$type', 'PAYMENT'] }, '$amount', 0] },
              },
            },
          },
          { $sort: { totalDeliveries: -1 } },
          { $limit: 3 },
          {
            $lookup: {
              from: 'sellers',
              localField: '_id',
              foreignField: '_id',
              as: 'seller',
            },
          },
          { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              name: { $ifNull: ['$seller.name', 'Vendor Account'] },
              totalDeliveries: 1,
              totalPaid: 1,
              totalDues: { $subtract: ['$totalDeliveries', '$totalPaid'] },
            },
          },
        ]),
        SellerModel.countDocuments(),
      ]);

      const totalBilledSalesRounded = Math.round((totalsAgg[0]?.totalBilledSales || 0) * 100) / 100;
      const totalClearedPaymentsRounded = Math.round((totalsAgg[0]?.totalClearedPayments || 0) * 100) / 100;
      const totalOutstandingDues = Math.round((totalBilledSalesRounded - totalClearedPaymentsRounded) * 100) / 100;
      const collectionEfficiencyRate = totalBilledSalesRounded > 0
        ? (totalClearedPaymentsRounded / totalBilledSalesRounded) * 100
        : 100;

      const topSellers = topDeliveriesAgg.map((s: any) => ({
        name: s.name,
        totalDeliveries: Math.round(s.totalDeliveries * 100) / 100,
        totalPaid: Math.round(s.totalPaid * 100) / 100,
        totalDues: Math.round((s.totalDues || 0) * 100) / 100,
      }));

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalSellers,
            totalBilledSales: totalBilledSalesRounded,
            totalClearedPayments: totalClearedPaymentsRounded,
            totalOutstandingDues,
            collectionEfficiencyRate: Number(collectionEfficiencyRate.toFixed(1)),
          },
          tankBreakdown: {
            tank500: totalsAgg[0]?.tank500 || 0,
            tank1000: totalsAgg[0]?.tank1000 || 0,
            tank2000: totalsAgg[0]?.tank2000 || 0,
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

      const summary = await TransactionModel.aggregate([
        {
          $match: {
            type: 'DELIVERY',
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: '$sellerId',
            total500: { $sum: '$tank500' },
            total1000: { $sum: '$tank1000' },
            total2000: { $sum: '$tank2000' },
          },
        },
        {
          $lookup: {
            from: 'sellers',
            localField: '_id',
            foreignField: '_id',
            as: 'seller',
          },
        },
        { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            sellerId: { $toString: '$_id' },
            sellerName: { $ifNull: ['$seller.name', 'Vendor Account'] },
            total500: '$total500',
            total1000: '$total1000',
            total2000: '$total2000',
            totalOrders: { $add: ['$total500', '$total1000', '$total2000'] },
          },
        },
        { $sort: { totalOrders: -1 } },
      ]);

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
