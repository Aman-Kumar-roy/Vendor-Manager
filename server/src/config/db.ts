import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!env.MONGODB_URI) {
    const errorMsg = '⚠️ MongoDB URI is missing. Please set MONGODB_URI (or MONGO_URL / DATABASE_URL) in your Railway Environment Variables.';
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    if (env.APP_DEBUG) {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  } catch (error) {
    console.error('❌ Failed to establish MongoDB Connection:', error);
    throw error;
  }
}
