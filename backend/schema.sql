USE integrated_business_dss;

-- 1. Users Table (Role-Based Access)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Owner', 'Shop Manager', 'EV Operator', 'Fleet Manager', 'Driver', 'Accountant') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tyre Inventory Table
CREATE TABLE IF NOT EXISTS tyres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    pattern VARCHAR(100),
    size VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    buying_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tyre Sales Table
CREATE TABLE IF NOT EXISTS tyre_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tyre_id INT NOT NULL,
    customer_name VARCHAR(100),
    quantity_sold INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tyre_id) REFERENCES tyres(id) ON DELETE CASCADE
);

-- 4. EV Charging Points Table
CREATE TABLE IF NOT EXISTS charging_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    charger_type ENUM('AC Type 2', 'DC Fast CCS2', 'CHAdeMO') NOT NULL,
    rate_per_kwh DECIMAL(10, 2) NOT NULL,
    status ENUM('Available', 'Charging', 'Maintenance') DEFAULT 'Available'
);

-- 5. EV Charging Sessions Table
CREATE TABLE IF NOT EXISTS charging_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    point_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME DEFAULT NULL,
    energy_consumed_kwh DECIMAL(10, 2) NOT NULL,
    rate_per_kwh DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (point_id) REFERENCES charging_points(id) ON DELETE CASCADE
);