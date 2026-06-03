import { NextResponse } from 'next/server';
import { uploadToGridFS } from '@/lib/gridfs';
import dbConnect from '@/lib/db';
import Organization from '@/models/Organization';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = await uploadToGridFS(file, { organizationId: org._id });
    return NextResponse.json({ fileId, url: `/api/${tenant}/files/${fileId}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
