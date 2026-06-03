import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
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
    const payments = await Payment.find({ organizationId: org._id })
      .populate('customerId', 'name')
      .sort({ date: -1 });
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
  try {
    const org = await Organization.findOne({ slug: tenant });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const body = await request.json();
    const payment = await Payment.create({ ...body, organizationId: org._id });

    // If an invoice is linked, mark it as paid
    if (body.invoiceId) {
      await Invoice.findOneAndUpdate(
        { _id: body.invoiceId, organizationId: org._id },
        { status: 'paid' }
      );
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
