import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
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
    const invoices = await Invoice.find({ organizationId: organization._id }).populate('customerId', 'name').sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
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
    const Customer = (await import('@/models/Customer')).default;
    const customer = await Customer.findOne({ _id: body.customerId, organizationId: organization._id });
    if (!customer) {
      return NextResponse.json({ error: 'Invalid customer for this organization' }, { status: 400 });
    }

    // Set nextOccurrence if it is a recurring invoice
    if (body.isRecurring && body.recurringInterval) {
      const nextDate = new Date();
      if (body.recurringInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (body.recurringInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (body.recurringInterval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      body.nextOccurrence = nextDate;
    }

    const invoice = await Invoice.create({ ...body, organizationId: organization._id });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
