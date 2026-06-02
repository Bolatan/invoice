import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { to, invoiceNumber, amount } = await request.json();

    // In a real app, you'd check if these environment variables are set
    if (!process.env.EMAIL_USER) {
      return NextResponse.json({ message: 'Email service not configured, but simulated success' }, { status: 200 });
    }

    await sendInvoiceEmail(to, invoiceNumber, amount);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
