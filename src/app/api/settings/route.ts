import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';

export async function GET() {
  try {
    await dbConnect();
    let setting = await Setting.findOne({});
    if (!setting) {
      // Return default settings if none exist yet
      return NextResponse.json({
        organizationName: 'Invoicing App',
        email: 'admin@example.com',
        currency: 'NGN',
      });
    }
    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    let setting = await Setting.findOne({});

    if (setting) {
      setting = await Setting.findByIdAndUpdate(setting._id, body, { new: true });
    } else {
      setting = await Setting.create(body);
    }

    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
