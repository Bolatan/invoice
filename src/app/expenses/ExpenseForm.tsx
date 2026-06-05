"use client";

import React from "react";
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
import { Plus, Upload } from "lucide-react";

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  vendor: z.string().optional(),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onSuccess: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const data = {
        ...values,
        amount: parseFloat(values.amount)
      };
      let receiptUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        receiptUrl = uploadData.url;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, receiptUrl }),
      });

      if (res.ok) {
        reset();
        setFile(null);
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to record expense", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Record Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record New Expense</DialogTitle>
          <DialogDescription>
            Fill in the expense details and upload a receipt if available.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input {...register("date")} type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input {...register("amount")} type="number" step="any" min="0" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              {...register("category")}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select Category</option>
              <option value="Transport">Transport</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Entertainment">Entertainment</option>
            </select>
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor</label>
            <Input {...register("vendor")} placeholder="Vendor Name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Receipt</label>
            <div className="flex items-center space-x-2">
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="cursor-pointer" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
