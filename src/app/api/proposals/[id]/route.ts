import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/models/Proposal';
import Customer from '@/models/Customer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const proposal = await Proposal.findById(id)
      .populate('customerId', 'name')
      .lean();
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch proposal' }, { status: 500 });
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
    const proposal = await Proposal.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    return NextResponse.json(proposal);
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A proposal with this number already exists.' }, { status: 400 });
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
    const proposal = await Proposal.findByIdAndDelete(id);
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Proposal deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete proposal' }, { status: 500 });
  }
}
