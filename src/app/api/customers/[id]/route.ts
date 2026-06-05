import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const customer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A customer with this email already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
