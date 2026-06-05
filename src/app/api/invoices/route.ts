import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await dbConnect();
    const invoices = await Invoice.find({}).populate('customerId', 'name').sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Set nextOccurrence if it is a recurring invoice
    if (body.isRecurring && body.recurringInterval) {
      const nextDate = new Date();
      if (body.recurringInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (body.recurringInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (body.recurringInterval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      body.nextOccurrence = nextDate;
    }

    const invoice = await Invoice.create(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
