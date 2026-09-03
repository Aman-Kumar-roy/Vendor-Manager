import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose;
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
    if (!env.IS_PRODUCTION) {
      process.exit(1);
    }
    throw error;
  }
}
