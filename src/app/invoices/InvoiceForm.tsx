"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2 } from "lucide-react";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  date: z.string(),
  dueDate: z.string(),
  isRecurring: z.boolean(),
  recurringInterval: z.enum(["weekly", "monthly", "yearly"]).optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Required"),
    quantity: z.number().min(1),
    rate: z.number().min(0),
    amount: z.number(),
  })).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSuccess: () => void;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

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
    defaultValues: {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      isRecurring: false,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    fetch("/api/customers").then(res => res.json()).then(setCustomers);
  }, []);

  const items = watch("items");

  useEffect(() => {
    items.forEach((item, index) => {
      const amount = item.quantity * item.rate;
      if (item.amount !== amount) {
        setValue(`items.${index}.amount`, amount);
      }
    });
  }, [items, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const subtotal = data.items.reduce((acc: number, item: any) => acc + item.amount, 0);
      const total = subtotal; // Simplified

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subtotal, total }),
      });

      if (res.ok) {
        reset();
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create invoice", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Number</label>
              <Input {...register("invoiceNumber")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <select
                {...register("customerId")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input {...register("date")} type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input {...register("dueDate")} type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
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
                  <Input {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} type="number" placeholder="Qty" />
                </div>
                <div className="col-span-2">
                  <Input {...register(`items.${index}.rate` as const, { valueAsNumber: true })} type="number" placeholder="Rate" />
                </div>
                <div className="col-span-1 text-sm py-2 font-medium">
                  ${(watch(`items.${index}.amount`) || 0).toFixed(2)}
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
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
