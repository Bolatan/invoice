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

const proposalSchema = z.object({
  proposalNumber: z.string().min(1, "Required"),
  customerId: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  date: z.string(),
  content: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Required"),
    amount: z.number().min(0),
  })).min(1),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  onSuccess: () => void;
}

export function ProposalForm({ onSuccess }: ProposalFormProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const { register, handleSubmit, control, reset, watch, formState: { isSubmitting } } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      proposalNumber: `PROP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      items: [{ description: "", amount: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    fetch("/api/customers").then(res => res.json()).then(setCustomers);
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const total = data.items.reduce((acc: number, item: any) => acc + item.amount, 0);
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, total }),
      });
      if (res.ok) {
        reset();
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create proposal", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proposal #</label>
              <Input {...register("proposalNumber")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <select {...register("customerId")} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input {...register("title")} placeholder="Proposal for Web Development" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold">Items</div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-8"><Input {...register(`items.${index}.description` as const)} placeholder="Description" /></div>
                <div className="col-span-3"><Input {...register(`items.${index}.amount` as const, { valueAsNumber: true })} type="number" placeholder="Amount" /></div>
                <div className="col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", amount: 0 })}>Add Item</Button>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Create Proposal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
