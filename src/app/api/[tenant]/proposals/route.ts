import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/models/Proposal';
import Organization from '@/models/Organization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  await dbConnect();
  const { tenant } = await params;
  try {
    const org = await Organization.findOne({ slug: tenant });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const proposals = await Proposal.find({ organizationId: org._id })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  await dbConnect();
  const { tenant } = await params;
  try {
    const org = await Organization.findOne({ slug: tenant });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const body = await request.json();
    const proposal = await Proposal.create({ ...body, organizationId: org._id });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
