import { NextResponse } from 'next/server';
import { getGridFSBucket } from '@/lib/gridfs';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bucket = await getGridFSBucket();
    const { id: fileId } = await params;
    const id = new ObjectId(fileId);

    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = files[0];
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
