"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";

const proposalSchema = z.object({
  proposalNumber: z.string().min(1, "Required"),
  customerId: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  date: z.string(),
  content: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Required"),
    amount: z.number().min(0),
    imageUrl: z.string().optional(),
  })).min(1),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  onSuccess: () => void;
  proposal?: any;
  trigger?: React.ReactNode;
}

export function ProposalForm({ onSuccess, proposal, trigger }: ProposalFormProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const isEditing = !!proposal;

  const { register, handleSubmit, control, reset, watch, setValue, formState: { isSubmitting } } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: proposal ? {
      ...proposal,
      customerId: proposal.customerId._id || proposal.customerId,
      date: new Date(proposal.date).toISOString().split('T')[0],
    } : {
      proposalNumber: `PROP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      items: [{ description: "", amount: 0, imageUrl: "" }],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open && proposal) {
      reset({
        ...proposal,
        customerId: proposal.customerId._id || proposal.customerId,
        date: new Date(proposal.date).toISOString().split('T')[0],
      });
    }
  }, [open, proposal, reset]);
  const [uploadingIndices, setUploadingIndices] = useState<Set<number>>(new Set());
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndices(prev => new Set(prev).add(index));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setValue(`items.${index}.imageUrl`, data.url);
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploadingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  useEffect(() => {
    fetch("/api/customers").then(res => res.json()).then(setCustomers);
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const total = data.items.reduce((acc: number, item: any) => acc + item.amount, 0);
      const url = isEditing ? `/api/proposals/${proposal._id}` : "/api/proposals";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, total }),
      });
      if (res.ok) {
        if (!isEditing) reset();
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? "update" : "create"} proposal`, error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Proposal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Proposal" : "Create New Proposal"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your proposal here. Click save when you're done."
              : "Draft a new proposal for your customer. Add items and set the total."}
          </DialogDescription>
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
              <div key={field.id} className="space-y-2 border-b pb-4 last:border-0">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-7"><Input {...register(`items.${index}.description` as const)} placeholder="Description" /></div>
                  <div className="col-span-3"><Input {...register(`items.${index}.amount` as const, { valueAsNumber: true })} type="number" placeholder="Amount" /></div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <div className="relative">
                      <input
                        type="file"
                        ref={el => { fileInputRefs.current[index] = el; }}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        disabled={uploadingIndices.has(index)}
                      >
                        {uploadingIndices.has(index) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
                {watch(`items.${index}.imageUrl`) && (
                  <div className="mt-2 relative w-20 h-20 border rounded-md overflow-hidden">
                    <img
                      src={watch(`items.${index}.imageUrl`)}
                      alt="Item preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                      onClick={() => setValue(`items.${index}.imageUrl`, "")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", amount: 0, imageUrl: "" })}>Add Item</Button>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
