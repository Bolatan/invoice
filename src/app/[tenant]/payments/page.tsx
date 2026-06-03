"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import jsPDF from "jspdf";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/utils";

interface Payment {
  _id: string;
  paymentNumber: string;
  date: string;
  customerId: { _id: string; name: string };
  amount: number;
  paymentMode: string;
  reference?: string;
}

export default function PaymentsPage() {
  const { tenant } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/${tenant}/api/payments`);
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = (payment: Payment) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("PAYMENT RECEIPT", 14, 22);

    doc.setFontSize(12);
    doc.text(`Receipt Number: ${payment.paymentNumber}`, 14, 40);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 14, 50);
    doc.text(`Received From: ${payment.customerId.name}`, 14, 60);
    doc.text(`Amount Received: ${CURRENCY_SYMBOL}${payment.amount.toFixed(2)}`, 14, 70);
    doc.text(`Payment Mode: ${payment.paymentMode}`, 14, 80);
    if (payment.reference) {
      doc.text(`Reference: ${payment.reference}`, 14, 90);
    }

    doc.rect(10, 10, 190, 100);

    doc.save(`Receipt_${payment.paymentNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Received</h1>
          <p className="text-gray-500">View and record customer payments.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading payments...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No payments found.</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.paymentNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.customerId.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{payment.paymentMode.replace('_', ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => generateReceipt(payment)}>
                      <Receipt className="h-4 w-4 mr-1" /> Receipt
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
