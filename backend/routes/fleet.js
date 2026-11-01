const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/vehicles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM fleet_vehicles ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/trips', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, v.plate_number 
      FROM fleet_trips t 
      LEFT JOIN fleet_vehicles v ON t.vehicle_id = v.id 
      ORDER BY t.trip_date DESC LIMIT 50
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/trips', verifyToken, requireRole(['Admin', 'Fleet Manager', 'Driver']), async (req, res) => {
  try {
    const { vehicle_id, origin, destination, distance_km, revenue } = req.body;
    await db.query(
      'INSERT INTO fleet_trips (vehicle_id, origin, destination, distance_km, revenue) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, origin, destination, distance_km, revenue]
    );
    res.json({ success: true, message: 'Trip recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/expenses', verifyToken, requireRole(['Admin', 'Fleet Manager']), async (req, res) => {
  try {
    const { vehicle_id, expense_type, amount } = req.body;
    await db.query(
      'INSERT INTO fleet_expenses (vehicle_id, expense_type, amount) VALUES (?, ?, ?)',
      [vehicle_id, expense_type, amount]
    );
    res.json({ success: true, message: 'Expense logged' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;