import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';

export async function GET() {
  await dbConnect();

  try {
    // Get date range for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Aggregate monthly revenue from paid invoices
    const revenueData = await Invoice.aggregate([
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
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    // Aggregate monthly expenses
    const expenseData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    // Aggregate revenue by category (using expense categories as a proxy for this example if needed,
    // but the request asks for revenue by category. Since Invoices don't have categories,
    // let's aggregate expenses by category and maybe revenue by status or customer)

    const expenseByCategory = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0
        }
      },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);

    // Format monthly data for Recharts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      const rev = revenueData.find(r => r._id.year === year && r._id.month === month);
      const exp = expenseData.find(e => e._id.year === year && e._id.month === month);

      chartData.push({
        name: months[d.getMonth()],
        revenue: rev ? rev.totalRevenue : 0,
        expenses: exp ? exp.totalExpenses : 0
      });
    }

    return NextResponse.json({
      monthlyData: chartData,
      expenseByCategory: expenseByCategory
    });
  } catch (error: any) {
    console.error('Reports API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
