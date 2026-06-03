import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
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
    const invoices = await Invoice.find({ organizationId: org._id })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });
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
  try {
    const org = await Organization.findOne({ slug: tenant });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const body = await request.json();

    // Set nextOccurrence if it is a recurring invoice
    if (body.isRecurring && body.recurringInterval) {
      const nextDate = new Date();
      if (body.recurringInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (body.recurringInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (body.recurringInterval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      body.nextOccurrence = nextDate;
    }

    const invoice = await Invoice.create({ ...body, organizationId: org._id });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
