import { NextResponse } from 'next/server';
import { uploadToGridFS } from '@/lib/gridfs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileId = await uploadToGridFS(file);
    return NextResponse.json({ fileId, url: `/api/files/${fileId}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
