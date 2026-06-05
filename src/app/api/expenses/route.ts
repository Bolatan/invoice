import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';

export async function GET() {
  try {
    await dbConnect();
    const expenses = await Expense.find({}).sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const expense = await Expense.create(body);
    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
