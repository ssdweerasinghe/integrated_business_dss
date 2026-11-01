const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'integrated_business_dss',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
// Enable SSL/TLS for TiDB Cloud / remote database connections
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST !== 'localhost' 
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } 
    : false
});


async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database: ' + process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();

module.exports = pool;