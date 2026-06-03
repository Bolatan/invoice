import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';
import { getOrganizationBySlug } from '@/lib/tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    await dbConnect();
    const { tenant } = await params;
    const organization = await getOrganizationBySlug(tenant);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let setting = await Setting.findOne({ organizationId: organization._id });
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    await dbConnect();
    const { tenant } = await params;
    const organization = await getOrganizationBySlug(tenant);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    let setting = await Setting.findOne({ organizationId: organization._id });

    if (setting) {
      setting = await Setting.findByIdAndUpdate(setting._id, body, { new: true });
    } else {
      setting = await Setting.create({ ...body, organizationId: organization._id });
    }

    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
