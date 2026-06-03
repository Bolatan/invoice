import { MongoClient, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI;

interface MongoCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  var mongo: MongoCache | undefined;
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { client: null, promise: null };
}

export async function getMongoClient() {
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached!.client) {
    return cached!.client;
  }

  if (!cached!.promise) {
    cached!.promise = new MongoClient(uri).connect().then((client) => {
      return client;
    });
  }

  try {
    cached!.client = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.client;
}

export async function getGridFSBucket() {
  const client = await getMongoClient();
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
