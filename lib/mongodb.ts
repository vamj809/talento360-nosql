import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/talento360";

let clientPromise: Promise<MongoClient>;

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global.mongoClientPromise) {
  const client = new MongoClient(uri);
  global.mongoClientPromise = client.connect();
}

clientPromise = global.mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db();
}