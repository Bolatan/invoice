import { MongoClient, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = uri ? new MongoClient(uri) : null;

export async function getGridFSBucket() {
  if (!client) {
    throw new Error('MONGODB_URI is not defined');
  }
  await client.connect();
  const db = client.db();
  return new GridFSBucket(db, { bucketName: 'uploads' });
}

export async function uploadToGridFS(file: File) {
  const bucket = await getGridFSBucket();
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadStream = bucket.openUploadStream(file.name, {
    metadata: { contentType: file.type }
  });

  return new Promise((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.end(buffer);
  });
}
