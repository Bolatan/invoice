"use client";

import React, { useEffect, useState } from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const settingsSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { tenant } = useTenant();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (!tenant) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/${tenant}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          reset(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset, tenant]);

  const onSubmit = async (data: SettingsFormValues) => {
    setMessage(null);
    try {
      const res = await fetch(`/${tenant}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: "Your organization settings have been saved successfully." });
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Failed to update settings. Please try again." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your organization profile and preferences.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input {...register("organizationName")} placeholder="Acme Inc." />
              {errors.organizationName && (
                <p className="text-xs text-red-500">{errors.organizationName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input {...register("email")} type="email" placeholder="admin@acme.com" />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input {...register("phone")} placeholder="+234 123 456 7890" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax ID / VAT Number</label>
              <Input {...register("taxId")} placeholder="RC12345678" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Business Address</label>
              <textarea
                {...register("address")}
                className="w-full min-h-[100px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="123 Business Way, Lagos, Nigeria"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input {...register("currency")} disabled placeholder="NGN" />
              <p className="text-xs text-gray-400 italic">Currency is currently locked to NGN</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
