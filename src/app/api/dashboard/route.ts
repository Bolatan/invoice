import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';
import Customer from '@/models/Customer';
import Payment from '@/models/Payment';

export async function GET() {
  await dbConnect();

  try {
    const totalCustomers = await Customer.countDocuments();

    const pendingInvoices = await Invoice.aggregate([
      { $match: { status: { $in: ['sent', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expensesMonth = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPayments = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentInvoices = await Invoice.find({})
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly revenue for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      const rev = monthlyRevenue.find(r => r._id.year === year && r._id.month === month);

      chartData.push({
        name: months[d.getMonth()],
        revenue: rev ? rev.revenue : 0
      });
    }

    return NextResponse.json({
      stats: {
        totalCustomers,
        pendingInvoices: pendingInvoices[0]?.total || 0,
        expensesMonth: expensesMonth[0]?.total || 0,
        totalPayments: totalPayments[0]?.total || 0
      },
      chartData,
      recentInvoices
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
