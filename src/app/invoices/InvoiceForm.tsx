"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  date: z.string(),
  dueDate: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  isRecurring: z.boolean(),
  recurringInterval: z.enum(["weekly", "monthly", "yearly"]).optional(),
  proposalId: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Required"),
    quantity: z.number().gt(0),
    rate: z.number().min(0),
    amount: z.number(),
  })).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSuccess: () => void;
  invoice?: any;
  trigger?: React.ReactNode;
}

export function InvoiceForm({ onSuccess, invoice, trigger }: InvoiceFormProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const isEditing = !!(invoice && invoice._id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      ...invoice,
      customerId: invoice.customerId?._id || invoice.customerId,
      date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      status: invoice.status || 'draft',
      proposalId: invoice.proposalId?._id || invoice.proposalId,
    } : {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      isRecurring: false,
      status: 'draft',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      if (invoice) {
        reset({
          ...invoice,
          customerId: invoice.customerId?._id || invoice.customerId,
          date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          status: invoice.status || 'draft',
          proposalId: invoice.proposalId?._id || invoice.proposalId,
        });
      } else {
        reset({
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
          isRecurring: false,
          status: 'draft',
          proposalId: "",
        });
      }
      setLastSelectedProposalId(invoice?.proposalId?._id || invoice?.proposalId);
    }
  }, [open, invoice, reset]);

  useEffect(() => {
    fetch("/api/customers").then(res => res.json()).then(setCustomers);
    fetch("/api/proposals").then(res => res.json()).then(setProposals);
  }, []);

  const selectedProposalId = watch("proposalId");
  const [lastSelectedProposalId, setLastSelectedProposalId] = useState<string | undefined>(
    invoice?.proposalId?._id || invoice?.proposalId
  );

  useEffect(() => {
    if (!Array.isArray(proposals)) return;

    if (selectedProposalId) {
      if (selectedProposalId !== lastSelectedProposalId) {
        const proposal = proposals.find(p => p._id === selectedProposalId);
        if (proposal) {
          // Autopopulate customer
          if (proposal.customerId) {
            const cId = (proposal.customerId && typeof proposal.customerId === 'object') ? proposal.customerId._id : proposal.customerId;
            setValue("customerId", cId);
          }
          // Autopopulate items
          if (proposal.items && Array.isArray(proposal.items)) {
            const newItems = proposal.items.map((item: any) => ({
              description: item.description,
              quantity: 1,
              rate: item.amount,
              amount: item.amount
            }));
            setValue("items", newItems);
          }
          setLastSelectedProposalId(selectedProposalId);
        }
      }
    } else {
      setLastSelectedProposalId("");
    }
  }, [selectedProposalId, proposals, setValue, lastSelectedProposalId]);

  const items = watch("items");

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name?.startsWith('items.') && (name.endsWith('.quantity') || name.endsWith('.rate'))) {
        const index = parseInt(name.split('.')[1]);
        const item = value.items?.[index];
        if (item) {
          const qty = Number(item.quantity) || 0;
          const rate = Number(item.rate) || 0;
          const amount = qty * rate;
          if (item.amount !== amount) {
            setValue(`items.${index}.amount` as any, amount);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const subtotal = data.items.reduce((acc: number, item: any) => acc + item.amount, 0);
      const total = subtotal; // Simplified

      const url = isEditing ? `/api/invoices/${invoice._id}` : "/api/invoices";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subtotal, total }),
      });

      if (res.ok) {
        if (!isEditing) reset();
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? "update" : "create"} invoice`, error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your invoice here. Click save when you're done."
              : "Generate a new invoice. Fill in the customer details and line items."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="invoiceNumber" className="text-sm font-medium">Invoice Number</label>
              <Input id="invoiceNumber" {...register("invoiceNumber")} />
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
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor="proposalId" className="text-sm font-medium">Associated Proposal (Optional)</label>
              <select
                id="proposalId"
                {...register("proposalId")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {Array.isArray(proposals) && proposals.map(p => (
                  <option key={p._id} value={p._id}>{p.proposalNumber} - {p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <Input id="date" {...register("date")} type="date" />
            </div>
            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
              <Input id="dueDate" {...register("dueDate")} type="date" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <select
                id="status"
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 pt-8">
                <input type="checkbox" {...register("isRecurring")} id="isRecurring" />
                <label htmlFor="isRecurring" className="text-sm font-medium">Recurring Invoice</label>
              </div>
              {watch("isRecurring") && (
                <select
                  {...register("recurringInterval")}
                  className="mt-2 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, rate: 0, amount: 0 })}>
                Add Item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Input {...register(`items.${index}.description` as const)} placeholder="Description" />
                </div>
                <div className="col-span-2">
                  <Input {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} type="number" min="0" step="any" placeholder="Qty" />
                </div>
                <div className="col-span-2">
                  <Input {...register(`items.${index}.rate` as const, { valueAsNumber: true })} type="number" min="0" step="any" placeholder="Rate" />
                </div>
                <div className="col-span-1 text-sm py-2 font-medium">
                  {formatCurrency(watch(`items.${index}.amount`) || 0)}
                </div>
                <div className="col-span-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
