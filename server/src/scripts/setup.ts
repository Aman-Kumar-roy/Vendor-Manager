import { initDatabase } from '../utils/db';
import { env } from '../config/env';
import { execSync } from 'child_process';

async function runSetup() {
  console.log('====================================================');
  console.log('🚀 Vasudha Seller Admin Panel - Native MySQL Setup');
  console.log('====================================================\n');

  console.log(`📋 Configuration detected from .env:`);
  console.log(`   - APP_URL       : ${env.APP_URL}`);
  console.log(`   - APP_TIMEZONE  : ${env.APP_TIMEZONE}`);
  console.log(`   - DB_CONNECTION : ${env.DB_CONNECTION}`);
  console.log(`   - DB_HOST       : ${env.DB_HOST}`);
  console.log(`   - DB_PORT       : ${env.DB_PORT}`);
  console.log(`   - DB_DATABASE   : ${env.DB_DATABASE}`);
  console.log(`   - DB_USERNAME   : ${env.DB_USERNAME}`);
  console.log(`   - DB_PASSWORD   : ${env.DB_PASSWORD ? '********' : '(empty)'}\n`);

  // 1. Connect to MySQL, Create DB, and Create Tables
  console.log(`⏳ Step 1: Connecting to MySQL server & initializing tables...`);
  try {
    await initDatabase();
    console.log(`✅ MySQL Database '${env.DB_DATABASE}' and SQL tables initialized!`);
  } catch (err: any) {
    console.error(`\n❌ MySQL Initialization Error:`, err.message);
    console.error(`👉 Please verify your DB_USERNAME and DB_PASSWORD inside server/.env`);
    process.exit(1);
  }

  // 2. Seed Database
  console.log(`\n⏳ Step 2: Seeding default Admin user & vendor dummy data...`);
  try {
    execSync('npx ts-node src/scripts/seed.ts', { stdio: 'inherit', cwd: process.cwd() });
  } catch (err) {
    console.error('❌ Failed to seed dummy data');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 Native MySQL Setup Completed Successfully!');
  console.log('====================================================');
  console.log(`🔑 Admin Login   : admin@example.com`);
  console.log(`🔐 Admin Password: admin123`);
  console.log(`🌐 App URL       : ${env.APP_URL}`);
  console.log(`🗄️  MySQL Database : ${env.DB_DATABASE}`);
  console.log('====================================================\n');
}

runSetup().catch((e) => {
  console.error('Setup failed:', e);
  process.exit(1);
});
