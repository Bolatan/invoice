import { NextResponse } from 'next/server';
import { uploadToGridFS } from '@/lib/gridfs';
import { getOrganizationBySlug } from '@/lib/tenant';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params;
    const organization = await getOrganizationBySlug(tenant);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = await uploadToGridFS(file, organization._id.toString());
    return NextResponse.json({ fileId, url: `/${tenant}/api/files/${fileId}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
