import { NextResponse } from 'next/server';
import { getGridFSBucket } from '@/lib/gridfs';
import { ObjectId } from 'mongodb';
import { getOrganizationBySlug } from '@/lib/tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenant: string; id: string }> }
) {
  try {
    const { tenant, id: fileId } = await params;
    const organization = await getOrganizationBySlug(tenant);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const bucket = await getGridFSBucket();
    const id = new ObjectId(fileId);

    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = files[0];

    // Check if the file belongs to the organization
    if (file.metadata?.organizationId !== organization._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
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
