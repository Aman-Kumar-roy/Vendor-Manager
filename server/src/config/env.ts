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
    } catch (e) { }
  }
}

export const env = {
  get PORT(): string {
    reloadEnvIfNeeded();
    return (process.env.PORT || '5000').trim();
  },
  get MONGODB_URI(): string {
    reloadEnvIfNeeded();
    return (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');
  },
  get JWT_SECRET(): string {
    reloadEnvIfNeeded();
    return (process.env.JWT_SECRET || '').trim().replace(/^["']|["']$/g, '');
  },
  get JWT_EXPIRES_IN(): string {
    reloadEnvIfNeeded();
    return (process.env.JWT_EXPIRES_IN || '24h').trim().replace(/^["']|["']$/g, '');
  },
  get APP_ENV(): string {
    reloadEnvIfNeeded();
    return (process.env.APP_ENV || 'production').trim();
  },
  get APP_DEBUG(): boolean {
    reloadEnvIfNeeded();
    return process.env.APP_DEBUG === 'true';
  },
  get IS_PRODUCTION(): boolean {
    reloadEnvIfNeeded();
    return this.APP_ENV === 'production';
  },
  get COMPANY_NAME(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_NAME || '').trim().replace(/^["']|["']$/g, '');
  },
  get COMPANY_GST(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_GST || '').trim().replace(/^["']|["']$/g, '');
  },
  get COMPANY_PHONE(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_PHONE || '').trim().replace(/^["']|["']$/g, '');
  },
  get COMPANY_ADDRESS(): string {
    reloadEnvIfNeeded();
    return (process.env.VITE_COMPANY_ADDRESS || '').trim().replace(/^["']|["']$/g, '');
  },
  get PUBLIC_URL(): string {
    reloadEnvIfNeeded();
    return (process.env.PUBLIC_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  },
};

