import mysql from 'mysql2/promise';
import { env } from '../config/env';

// Create a connection pool to MySQL database
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper for executing query statements
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

// Function to initialize MySQL tables using pure SQL
export async function initDatabase() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
  });

  // Ensure database exists
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_DATABASE}\`;`);
  await connection.end();

  // Create User table
  await query(`
    CREATE TABLE IF NOT EXISTS User (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create Seller table
  await query(`
    CREATE TABLE IF NOT EXISTS Seller (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      address TEXT NULL,
      gstNumber VARCHAR(20) NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create Transaction table with parentId for linked order payments and tank fields
  await query(`
    CREATE TABLE IF NOT EXISTS Transaction (
      id VARCHAR(36) PRIMARY KEY,
      sellerId VARCHAR(36) NOT NULL,
      parentId VARCHAR(36) NULL,
      type VARCHAR(20) NOT NULL,
      amount DOUBLE NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT NULL,
      tank500 INT DEFAULT 0,
      tank1000 INT DEFAULT 0,
      tank2000 INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sellerId (sellerId),
      INDEX idx_parentId (parentId),
      FOREIGN KEY (sellerId) REFERENCES Seller(id) ON DELETE CASCADE,
      FOREIGN KEY (parentId) REFERENCES Transaction(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migration check: Add parentId and tank columns if table already exists without them
  try {
    const columns = await query<any[]>('SHOW COLUMNS FROM Transaction LIKE "parentId"');
    if (!columns || columns.length === 0) {
      await query(`
        ALTER TABLE Transaction 
        ADD COLUMN parentId VARCHAR(36) NULL AFTER sellerId,
        ADD INDEX idx_parentId (parentId),
        ADD CONSTRAINT fk_transaction_parent FOREIGN KEY (parentId) REFERENCES Transaction(id) ON DELETE SET NULL;
      `);
    }
  } catch (err) {}

  try {
    const tankCols = await query<any[]>('SHOW COLUMNS FROM Transaction LIKE "tank500"');
    if (!tankCols || tankCols.length === 0) {
      await query(`
        ALTER TABLE Transaction 
        ADD COLUMN tank500 INT DEFAULT 0 AFTER note,
        ADD COLUMN tank1000 INT DEFAULT 0 AFTER tank500,
        ADD COLUMN tank2000 INT DEFAULT 0 AFTER tank1000;
      `);
    }
  } catch (err) {}

  // Migration: Add gstNumber column if missing (safe for existing production tables)
  try {
    const gstCol = await query<any[]>('SHOW COLUMNS FROM Seller LIKE "gstNumber"');
    if (!gstCol || gstCol.length === 0) {
      await query(`ALTER TABLE Seller ADD COLUMN gstNumber VARCHAR(20) NULL AFTER address;`);
    }
  } catch (err) {}
}
