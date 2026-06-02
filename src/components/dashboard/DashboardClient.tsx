"use client";

import React from "react";
import {
  Users,
  Receipt,
  TrendingDown,
  CreditCard,
  ExternalLink
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface DashboardClientProps {
  stats: {
    totalCustomers: number;
    pendingInvoices: number;
    monthlyExpenses: number;
    monthlyPayments: number;
  };
  chartData: { name: string; revenue: number }[];
  recentInvoices: any[];
}

export function DashboardClient({ stats, chartData, recentInvoices }: DashboardClientProps) {
  const statItems = [
    { name: 'Total Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'bg-blue-500' },
    { name: 'Pending Invoices', value: formatCurrency(stats.pendingInvoices), icon: Receipt, color: 'bg-amber-500' },
    { name: 'Expenses (Month)', value: formatCurrency(stats.monthlyExpenses), icon: TrendingDown, color: 'bg-red-500' },
    { name: 'Payments Received', value: formatCurrency(stats.monthlyPayments), icon: CreditCard, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back to your business overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={`absolute rounded-md ${item.color} p-3`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₦${value}`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
            <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-500 flex items-center">
              View all <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="flow-root">
            {recentInvoices.length > 0 ? (
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <li key={invoice._id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {invoice.customerId?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {invoice.invoiceNumber} • {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-20 text-gray-400">
                No recent invoices found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
