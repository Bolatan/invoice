import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/models/Proposal';
import { getOrganizationBySlug } from '@/lib/tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  await dbConnect();
  const { tenant } = await params;
  const organization = await getOrganizationBySlug(tenant);
  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  try {
    const proposals = await Proposal.find({ organizationId: organization._id }).populate('customerId', 'name').sort({ createdAt: -1 });
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
  const organization = await getOrganizationBySlug(tenant);
  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Verify customer belongs to this organization
    const customer = await (await import('@/models/Customer')).default.findOne({ _id: body.customerId, organizationId: organization._id });
    if (!customer) {
      return NextResponse.json({ error: 'Invalid customer for this organization' }, { status: 400 });
    }

    const proposal = await Proposal.create({ ...body, organizationId: organization._id });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
