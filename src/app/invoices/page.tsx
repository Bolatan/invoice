"use client";

import React, { useState, useEffect } from "react";
import { Plus, Download, Mail, RefreshCw, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvoiceForm } from "./InvoiceForm";
import { formatCurrency, formatCurrencyDoc } from "@/lib/utils";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: { _id: string; name: string };
  total: number;
  status: string;
  date: string;
  dueDate: string;
  isRecurring: boolean;
  items: any[];
  proposalId?: { _id: string; proposalNumber: string };
}

const getStatusColor = (status: string) => {
  switch ((status || "draft").toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    case "draft":
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("INVOICE", 14, 22);
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 14, 35);
    doc.text(`Bill To: ${invoice.customerId.name}`, 14, 45);

    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity,
      formatCurrencyDoc(item.rate),
      formatCurrencyDoc(item.amount)
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Description', 'Quantity', 'Rate', 'Amount']],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text(`Total: ${formatCurrencyDoc(invoice.total)}`, 14, finalY + 10);
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">Create and manage client invoices.</p>
        </div>
        <InvoiceForm onSuccess={fetchInvoices} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading invoices...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No invoices found.</td>
              </tr>
            ) : (
              Array.isArray(invoices) && invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                    {invoice.invoiceNumber}
                    {invoice.isRecurring && <RefreshCw className="ml-2 h-3 w-3 text-blue-500" />}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.proposalId?.proposalNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.customerId.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <InvoiceForm
                      invoice={invoice}
                      onSuccess={fetchInvoices}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="sm" onClick={() => generatePDF(invoice)}>
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4 mr-1" /> Email
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
