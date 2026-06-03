import { MongoClient, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient: MongoClient | null = null;

export async function getGridFSBucket() {
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
  }

  await cachedClient.connect();
  const db = cachedClient.db();
  return new GridFSBucket(db, { bucketName: 'uploads' });
}

export async function uploadToGridFS(file: File, organizationId?: string) {
  const bucket = await getGridFSBucket();
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadStream = bucket.openUploadStream(file.name, {
    metadata: { contentType: file.type, organizationId }
  });

  return new Promise((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.end(buffer);
  });
}
