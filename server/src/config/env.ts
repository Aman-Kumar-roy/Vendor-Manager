import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConn = process.env.DB_CONNECTION || 'mysql';
const dbUser = process.env.DB_USERNAME || 'root';
const rawPass = process.env.DB_PASSWORD || '';
const dbPass = rawPass ? encodeURIComponent(rawPass) : '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || '3306';
const dbName = process.env.DB_DATABASE || 'vasudha_seller';

// Construct standard MySQL URL dynamically
const computedDbUrl = dbPass 
  ? `${dbConn}://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`
  : `${dbConn}://${dbUser}@${dbHost}:${dbPort}/${dbName}`;

const finalDatabaseUrl = process.env.DATABASE_URL || computedDbUrl;
process.env.DATABASE_URL = finalDatabaseUrl;

export const env = {
  PORT: process.env.PORT || 5000,
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  APP_ADMIN_URL: process.env.APP_ADMIN_URL || 'admin',
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  CLIENT_URL: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000',
  DB_CONNECTION: dbConn,
  DB_HOST: dbHost,
  DB_PORT: dbPort,
  DB_DATABASE: dbName,
  DB_USERNAME: dbUser,
  DB_PASSWORD: rawPass,
  DATABASE_URL: finalDatabaseUrl,
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-vasudha-seller-admin-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
