CREATE DATABASE IF NOT EXISTS ration_db;
USE ration_db;

CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    area VARCHAR(100) NOT NULL,
    address TEXT,
    working_hours_start TIME DEFAULT '08:00:00',
    working_hours_end TIME DEFAULT '20:00:00',
    camera_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    item_name VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    status ENUM('Available', 'Low Stock', 'Out Of Stock') NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_shop_item (shop_id, item_name)
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('citizen', 'staff', 'district_admin', 'state_admin') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    ration_card VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    district VARCHAR(50) NOT NULL,
    area VARCHAR(100) NOT NULL,
    assigned_shop INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_shop) REFERENCES shops(id) ON DELETE SET NULL
);

-- Insert dummy shop for assignment
INSERT INTO shops (name, district, area) VALUES ('Anna Nagar Main Ration Shop', 'Chennai', 'Anna Nagar');
