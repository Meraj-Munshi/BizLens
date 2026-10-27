require('dotenv').config();
const mysql = require('mysql2/promise');

const sslEnabled = /^(1|true|yes)$/i.test(process.env.DB_SSL || '');
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bizlens',
  dateStrings: true,
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  ...(sslEnabled ? { ssl: { rejectUnauthorized: !/^(0|false|no)$/i.test(process.env.DB_SSL_REJECT_UNAUTHORIZED || '') } } : {})
};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    throw new Error('Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME in the hosting environment.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured as a strong secret of at least 32 characters.');
  }
}

module.exports = mysql.createPool(poolConfig);
