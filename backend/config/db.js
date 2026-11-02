const mysql = require('mysql2/promise');
require('dotenv').config();

const isRemoteDatabase =
  process.env.DB_HOST &&
  !['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST.trim());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'integrated_business_dss',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' || isRemoteDatabase || process.env.NODE_ENV === 'production'
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : false
});

async function createDefaultSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('Owner','Admin','Shop Manager','EV Operator','EV System Manager','Fleet Manager','Fleet Operation Manager','Driver','Accountant') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tyres (
      id INT AUTO_INCREMENT PRIMARY KEY,
      brand VARCHAR(100) NOT NULL,
      pattern VARCHAR(100),
      size VARCHAR(50) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      buying_price DECIMAL(10, 2) NOT NULL,
      selling_price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tyre_sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tyre_id INT NOT NULL,
      customer_name VARCHAR(100),
      quantity_sold INT NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tyre_id) REFERENCES tyres(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS charging_points (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      charger_type ENUM('AC Type 2', 'DC Fast CCS2', 'CHAdeMO') NOT NULL,
      rate_per_kwh DECIMAL(10, 2) NOT NULL,
      status ENUM('Available', 'Charging', 'Maintenance') DEFAULT 'Available'
    )`,
    `CREATE TABLE IF NOT EXISTS charging_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      point_id INT NOT NULL,
      vehicle_number VARCHAR(20) NOT NULL,
      start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME DEFAULT NULL,
      energy_consumed_kwh DECIMAL(10, 2) NOT NULL,
      rate_per_kwh DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (point_id) REFERENCES charging_points(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      plate_number VARCHAR(20) NOT NULL UNIQUE,
      model VARCHAR(50) NOT NULL,
      driver_name VARCHAR(100) NOT NULL,
      status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS fleet_trips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      platform VARCHAR(50) DEFAULT 'Uber',
      trip_date DATE NOT NULL,
      gross_earnings DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS fleet_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      expense_type ENUM('Fuel', 'Maintenance', 'Insurance', 'Other') NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      expense_date DATE NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )`
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await createDefaultSchema();
    console.log('✅ Connected to MySQL Database: ' + (process.env.DB_NAME || 'integrated_business_dss'));
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();

module.exports = pool;
module.exports.initializeDatabase = createDefaultSchema;