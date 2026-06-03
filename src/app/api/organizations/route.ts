import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Organization from '@/models/Organization';

export async function GET() {
  await dbConnect();
  try {
    const organizations = await Organization.find({}).sort({ createdAt: -1 });
    return NextResponse.json(organizations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const slug = body.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const organization = await Organization.create({ ...body, slug });
    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
