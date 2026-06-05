import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/models/Proposal';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await dbConnect();
    const proposals = await Proposal.find({}).populate('customerId', 'name').sort({ createdAt: -1 });
    return NextResponse.json(proposals);
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const proposal = await Proposal.create(body);
    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
