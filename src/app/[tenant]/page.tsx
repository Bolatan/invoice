"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function LandingPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations");
      const data = await res.json();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName) return;
    setCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/${data.slug}`);
      } else {
        alert(data.error || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error creating organization", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Invoicing App</h1>
          <p className="text-gray-600">Select or create your organization portal</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Organizations</h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : organizations.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No organizations found. Create one below.</p>
            ) : (
              <ul className="space-y-2">
                {organizations.map((org) => (
                  <li key={org._id}>
                    <button
                      onClick={() => router.push(`/${org.slug}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3 group-hover:text-blue-500" />
                        <span className="font-medium text-gray-700">{org.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Create New Organization</h2>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g. Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Create Organization
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
