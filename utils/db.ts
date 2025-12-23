import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export async function connectToDatabase() {
  if (!uri) throw new Error("MONGODB_URI tidak ditemukan di .env");
  await client.connect();
  const db = client.db("digiflazz-datas");
  return { db, client };
}