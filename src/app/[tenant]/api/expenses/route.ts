import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
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
    const expenses = await Expense.find({ organizationId: organization._id }).sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
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
    const expense = await Expense.create({ ...body, organizationId: organization._id });
    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
