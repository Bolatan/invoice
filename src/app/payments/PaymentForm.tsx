"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus } from "lucide-react";

const paymentSchema = z.object({
  paymentNumber: z.string().min(1, "Payment number is required"),
  customerId: z.string().min(1, "Customer is required"),
  invoiceId: z.string().optional(),
  date: z.string(),
  amount: z.string().min(1, "Amount is required"),
  paymentMode: z.enum(['cash', 'bank_transfer', 'credit_card', 'check', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSuccess: () => void;
}

export function PaymentForm({ onSuccess }: PaymentFormProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'bank_transfer',
    }
  });

  useEffect(() => {
    if (open) {
      fetch("/api/customers").then(res => res.json()).then(setCustomers);
      fetch("/api/invoices").then(res => res.json()).then(setInvoices);
      setSubmitError(null);
    }
  }, [open]);

  const selectedCustomerId = watch("customerId");
  const filteredInvoices = Array.isArray(invoices)
    ? invoices.filter(inv => {
        const invCustId = inv.customerId?._id || inv.customerId;
        return invCustId === selectedCustomerId && inv.status !== 'paid';
      })
    : [];

  const selectedInvoiceId = watch("invoiceId");
  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find(inv => inv._id === selectedInvoiceId);
      if (invoice) {
        setValue("amount", invoice.total.toString());
      }
    }
  }, [selectedInvoiceId, invoices, setValue]);

  const onSubmit = async (values: PaymentFormValues) => {
    setSubmitError(null);
    try {
      const data = {
        ...values,
        amount: parseFloat(values.amount)
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        reset();
        setOpen(false);
        onSuccess();
      } else {
        setSubmitError(result.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Failed to record payment", error);
      setSubmitError("An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter the details of the payment received from the customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="paymentNumber" className="text-sm font-medium">Payment Number</label>
              <Input id="paymentNumber" {...register("paymentNumber")} />
              {errors.paymentNumber && <p className="text-xs text-red-500">{errors.paymentNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <Input id="date" {...register("date")} type="date" />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="customerId" className="text-sm font-medium">Customer</label>
            <select
              id="customerId"
              {...register("customerId")}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a customer</option>
              {Array.isArray(customers) && customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="invoiceId" className="text-sm font-medium">Invoice (Optional)</label>
            <select
              id="invoiceId"
              {...register("invoiceId")}
              disabled={!selectedCustomerId}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select an invoice</option>
              {filteredInvoices.map(inv => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} - total: {inv.total}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount Received</label>
              <Input id="amount" {...register("amount")} type="number" step="any" min="0" placeholder="0.00" />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="paymentMode" className="text-sm font-medium">Payment Mode</label>
              <select
                id="paymentMode"
                {...register("paymentMode")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
              {errors.paymentMode && <p className="text-xs text-red-500">{errors.paymentMode.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reference" className="text-sm font-medium">Reference / Transaction ID</label>
            <Input id="reference" {...register("reference")} placeholder="e.g. TXN123456" />
          </div>

          {submitError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {submitError}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
