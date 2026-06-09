import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/talento360";

declare global {
  var talento360MongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global.talento360MongoClientPromise) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  global.talento360MongoClientPromise = client.connect();
}

const clientPromise = global.talento360MongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

export async function pingMongo() {
  const db = await getDb();
  await db.command({ ping: 1 });
  return true;
}
