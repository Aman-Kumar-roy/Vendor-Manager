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

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const env = {
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
  APP_ENV: process.env.APP_ENV,
  APP_DEBUG: process.env.APP_DEBUG === 'true',
  IS_PRODUCTION: process.env.APP_ENV === 'production',
};
