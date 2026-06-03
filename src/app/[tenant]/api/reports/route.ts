import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';
import Payment from '@/models/Payment';
import { getOrganizationBySlug } from '@/lib/tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    await dbConnect();
    const { tenant } = await params;
    const organization = await getOrganizationBySlug(tenant);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = organization._id;

    // Revenue vs Expenses for the last 6 months
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthlyRevenue = await Payment.aggregate([
        { $match: { organizationId, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const monthlyExpenses = await Expense.aggregate([
        { $match: { organizationId, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      chartData.push({
        name: d.toLocaleString('default', { month: 'short' }),
        revenue: monthlyRevenue[0]?.total || 0,
        expenses: monthlyExpenses[0]?.total || 0,
      });
    }

    // Revenue by Category (simplified using Expense categories for now, or you might want something else)
    const categoryData = await Expense.aggregate([
      { $match: { organizationId } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    return NextResponse.json({ chartData, categoryData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
