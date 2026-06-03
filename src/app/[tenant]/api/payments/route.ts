import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
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
    const payments = await Payment.find({ organizationId: organization._id }).populate('customerId', 'name').sort({ date: -1 });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
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

    // Verify invoice belongs to this organization if provided
    if (body.invoiceId) {
      const invoice = await Invoice.findOne({ _id: body.invoiceId, organizationId: organization._id });
      if (!invoice) {
        return NextResponse.json({ error: 'Invalid invoice for this organization' }, { status: 400 });
      }
    }

    const payment = await Payment.create({ ...body, organizationId: organization._id });

    // If an invoice is linked, mark it as paid if amount matches or exceeds balance (simplified)
    if (body.invoiceId) {
      await Invoice.findByIdAndUpdate(body.invoiceId, { status: 'paid' });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
