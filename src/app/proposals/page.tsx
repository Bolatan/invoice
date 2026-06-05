"use client";

import React, { useState, useEffect } from "react";
import { Plus, Download, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import pptxgen from "pptxgenjs";
import { ProposalForm } from "./ProposalForm";
import { formatCurrency, formatCurrencyDoc } from "@/lib/utils";

interface Proposal {
  _id: string;
  proposalNumber: string;
  title: string;
  customerId: { _id: string; name: string };
  total: number;
  status: string;
  items?: {
    description: string;
    amount: number;
    imageUrl?: string;
  }[];
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals");
      const data = await res.json();
      setProposals(data);
    } catch (error) {
      console.error("Failed to fetch proposals", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePPTX = async (proposal: Proposal) => {
    const pres = new pptxgen();

    // Title Slide
    const titleSlide = pres.addSlide();
    titleSlide.addText(proposal.title, { x: 1, y: 1.5, w: '80%', fontSize: 32, color: "363636", align: 'center' });
    titleSlide.addText(`Proposal: ${proposal.proposalNumber}`, { x: 1, y: 2.5, w: '80%', fontSize: 18, align: 'center' });
    titleSlide.addText(`Client: ${proposal.customerId.name}`, { x: 1, y: 3.5, w: '80%', fontSize: 18, align: 'center' });

    // Items Slides
    if (proposal.items && proposal.items.length > 0) {
      for (const item of proposal.items) {
        const slide = pres.addSlide();
        slide.addText(item.description, { x: 0.5, y: 0.5, w: '90%', fontSize: 24, bold: true });
        slide.addText(`Amount: ${formatCurrencyDoc(item.amount)}`, { x: 0.5, y: 1.2, w: '90%', fontSize: 18 });

        if (item.imageUrl) {
          try {
            // Check if it's a relative URL and prepend origin if needed
            const imageUrl = item.imageUrl.startsWith('http')
              ? item.imageUrl
              : `${window.location.origin}${item.imageUrl}`;

            slide.addImage({
              path: imageUrl,
              x: 0.5,
              y: 1.8,
              w: 5,
              h: 3
            });
          } catch (error) {
            console.error("Failed to add image to PPTX", error);
          }
        }
      }
    }

    // Summary Slide
    const summarySlide = pres.addSlide();
    summarySlide.addText("Summary", { x: 1, y: 1, fontSize: 28, bold: true });
    summarySlide.addText(`Total Proposal Amount: ${formatCurrencyDoc(proposal.total)}`, { x: 1, y: 2, fontSize: 20 });

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
              Array.isArray(proposals) && proposals.map((proposal) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <ProposalForm
                      proposal={proposal}
                      onSuccess={fetchProposals}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      }
                    />
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
