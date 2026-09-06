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

let lastEnvMtime = 0;
let resolvedEnvPath: string | null = null;

export function reloadEnvIfNeeded(): void {
  if (!resolvedEnvPath) {
    for (const envPath of candidatePaths) {
      if (fs.existsSync(envPath)) {
        resolvedEnvPath = envPath;
        break;
      }
    }
  }
  if (resolvedEnvPath && fs.existsSync(resolvedEnvPath)) {
    try {
      const stats = fs.statSync(resolvedEnvPath);
      if (stats.mtimeMs !== lastEnvMtime) {
        lastEnvMtime = stats.mtimeMs;
        const parsed = dotenv.parse(fs.readFileSync(resolvedEnvPath));
        for (const k in parsed) {
          process.env[k] = parsed[k];
        }
      }
    } catch (e) {}
  }
}

export const env = {
  get PORT(): string {
    reloadEnvIfNeeded();
    return process.env.PORT || '5000';
  },
  get MONGODB_URI(): string {
    reloadEnvIfNeeded();
    const rawMongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.MONGODB_URL ||
      process.env.DATABASE_URL;
    return rawMongoUri ? rawMongoUri.trim().replace(/^["']|["']$/g, '') : '';
  },
  get JWT_SECRET(): string {
    reloadEnvIfNeeded();
    return (process.env.JWT_SECRET || 'roy').trim().replace(/^["']|["']$/g, '');
  },
  get JWT_EXPIRES_IN(): string {
    reloadEnvIfNeeded();
    return (process.env.JWT_EXPIRES_IN || '24h').trim().replace(/^["']|["']$/g, '');
  },
  get APP_ENV(): string {
    reloadEnvIfNeeded();
    return process.env.APP_ENV || process.env.NODE_ENV || 'development';
  },
  get APP_DEBUG(): boolean {
    reloadEnvIfNeeded();
    return process.env.APP_DEBUG === 'true';
  },
  get IS_PRODUCTION(): boolean {
    reloadEnvIfNeeded();
    return process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
  },
  get COMPANY_NAME(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_NAME || process.env.COMPANY_NAME || 'Vasudha Polymer').trim().replace(/^["']|["']$/g, '');
  },
  get COMPANY_GST(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_GST || process.env.COMPANY_GST || '07AAAAA0000A1Z5').trim().replace(/^["']|["']$/g, '');
  },
  get COMPANY_PHONE(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_PHONE || process.env.COMPANY_PHONE || '+91 98765 43210').trim().replace(/^["']|["']$/g, '');
  },
  get COMPANY_ADDRESS(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_ADDRESS || process.env.COMPANY_ADDRESS || 'Plot 42, Industrial Zone, New Delhi - 110020').trim().replace(/^["']|["']$/g, '');
  },
};
