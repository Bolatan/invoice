import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';
import Organization from '@/models/Organization';
import dbConnect from '@/lib/db';

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

    const { to, invoiceNumber, amount } = await request.json();

    if (!process.env.EMAIL_USER) {
      return NextResponse.json({ message: 'Email service not configured, but simulated success' }, { status: 200 });
    }

    // Pass organization name to email if needed
    await sendInvoiceEmail(to, invoiceNumber, amount);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
