"use client";
import { useParams } from "next/navigation";

import React, { useState, useEffect } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import pptxgen from "pptxgenjs";
import { ProposalForm } from "./ProposalForm";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/utils";

interface Proposal {
  _id: string;
  proposalNumber: string;
  title: string;
  customerId: { _id: string; name: string };
  total: number;
  status: string;
}

export default function ProposalsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch(`/api/${tenant}/proposals`);
      const data = await res.json();
      setProposals(data);
    } catch (error) {
      console.error("Failed to fetch proposals", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePPTX = (proposal: Proposal) => {
    const pres = new pptxgen();
    const slide = pres.addSlide();
    slide.addText(proposal.title, { x: 1, y: 1, fontSize: 32, color: "363636" });
    slide.addText(`Proposal Number: ${proposal.proposalNumber}`, { x: 1, y: 2, fontSize: 18 });
    slide.addText(`Client: ${proposal.customerId.name}`, { x: 1, y: 2.5, fontSize: 18 });
    slide.addText(`Total: ${CURRENCY_SYMBOL}${proposal.total.toFixed(2)}`, { x: 1, y: 3, fontSize: 18 });
    pres.writeFile({ fileName: `Proposal_${proposal.proposalNumber}.pptx` });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-500">Create and track business proposals.</p>
        </div>
        <ProposalForm onSuccess={fetchProposals} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading proposals...</td>
              </tr>
            ) : proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No proposals found.</td>
              </tr>
            ) : (
              proposals.map((proposal) => (
                <tr key={proposal._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{proposal.proposalNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{proposal.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{proposal.customerId.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(proposal.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => generatePPTX(proposal)}>
                      <Download className="h-4 w-4 mr-1" /> PPTX
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
