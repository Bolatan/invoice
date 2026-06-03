import { NextResponse } from 'next/server';
import { getGridFSBucket } from '@/lib/gridfs';
import { ObjectId } from 'mongodb';
import dbConnect from '@/lib/db';
import Organization from '@/models/Organization';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenant: string; id: string }> }
) {
  await dbConnect();
  const { tenant, id: fileId } = await params;
  try {
    const org = await Organization.findOne({ slug: tenant });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const bucket = await getGridFSBucket();
    const id = new ObjectId(fileId);

    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = files[0];

    // Check if the file belongs to the organization via metadata
    if (file.metadata?.organizationId?.toString() !== org._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized access to file' }, { status: 403 });
    }

    const stream = bucket.openDownloadStream(id);

    return new Response(stream as any, {
      headers: {
        'Content-Type': file.metadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
