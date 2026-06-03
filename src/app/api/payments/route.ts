import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    await dbConnect();
    const payments = await Payment.find({}).populate('customerId', 'name').sort({ date: -1 });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const payment = await Payment.create(body);

    // If an invoice is linked, mark it as paid if amount matches or exceeds balance (simplified)
    if (body.invoiceId) {
      await Invoice.findByIdAndUpdate(body.invoiceId, { status: 'paid' });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
