import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Locate root .env file
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

dotenv.config();

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Support MONGODB_URI, MONGO_URL, MONGODB_URL, DATABASE_URL (Railway standard)
const rawMongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL;

// Strip surrounding quotes if pasted into cloud UI with quotes
const cleanMongoUri = rawMongoUri
  ? rawMongoUri.trim().replace(/^["']|["']$/g, '')
  : '';

const cleanJwtSecret = process.env.JWT_SECRET
  ? process.env.JWT_SECRET.trim().replace(/^["']|["']$/g, '')
  : 'roy';

const cleanJwtExpiresIn = process.env.JWT_EXPIRES_IN
  ? process.env.JWT_EXPIRES_IN.trim().replace(/^["']|["']$/g, '')
  : '24h';

export const env = {
  PORT: process.env.PORT || '5000',
  MONGODB_URI: cleanMongoUri,
  JWT_SECRET: cleanJwtSecret,
  JWT_EXPIRES_IN: cleanJwtExpiresIn,
  APP_ENV: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  APP_DEBUG: process.env.APP_DEBUG === 'true',
  IS_PRODUCTION: process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production',
  COMPANY_NAME: process.env.VITE_COMPANY_NAME || process.env.COMPANY_NAME || 'Vasudha Polymer',
  COMPANY_GST: process.env.VITE_COMPANY_GST || process.env.COMPANY_GST || '07AAAAA0000A1Z5',
  COMPANY_PHONE: process.env.VITE_COMPANY_PHONE || process.env.COMPANY_PHONE || '+91 98765 43210',
  COMPANY_ADDRESS: process.env.VITE_COMPANY_ADDRESS || process.env.COMPANY_ADDRESS || 'Plot 42, Industrial Zone, New Delhi - 110020',
};
