import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import Invoice from "@/models/Invoice";
import Expense from "@/models/Expense";
import Payment from "@/models/Payment";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getOrganizationBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getDashboardData(tenant: string) {
  await dbConnect();
  const organization = await getOrganizationBySlug(tenant);
  if (!organization) return null;

  const organizationId = organization._id;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 1. Total Customers
  const totalCustomers = await Customer.countDocuments({ organizationId });

  // 2. Pending Invoices (Total amount of invoices not fully paid)
  const pendingInvoicesData = await Invoice.aggregate([
    { $match: { organizationId, status: { $ne: 'paid' } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const pendingInvoices = pendingInvoicesData[0]?.total || 0;

  // 3. Monthly Expenses
  const monthlyExpensesData = await Expense.aggregate([
    { $match: { organizationId, date: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const monthlyExpenses = monthlyExpensesData[0]?.total || 0;

  // 4. Monthly Payments
  const monthlyPaymentsData = await Payment.aggregate([
    { $match: { organizationId, date: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const monthlyPayments = monthlyPaymentsData[0]?.total || 0;

  // 5. Chart Data (Revenue for last 6 months)
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // Set to 1st to avoid rollover issues when current date is 29th-31st
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { organizationId, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    chartData.push({
      name: d.toLocaleString('default', { month: 'short' }),
      revenue: monthlyRevenue[0]?.total || 0
    });
  }

  // 6. Recent Invoices
  const recentInvoices = await Invoice.find({ organizationId })
    .populate('customerId', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return JSON.parse(
    JSON.stringify({
      stats: {
        totalCustomers,
        pendingInvoices,
        monthlyExpenses,
        monthlyPayments,
      },
      chartData,
      recentInvoices,
    })
  );
}

export default async function Home({ params }: { params: { tenant: string } }) {
  const { tenant } = await params;
  const data = await getDashboardData(tenant);

  if (!data) {
    notFound();
  }

  return (
    <DashboardClient
      stats={data.stats}
      chartData={data.chartData}
      recentInvoices={data.recentInvoices}
    />
  );
}
