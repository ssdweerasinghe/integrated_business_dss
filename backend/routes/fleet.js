const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/vehicles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicles ORDER BY id ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/trips', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, v.plate_number, v.model
      FROM fleet_trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      ORDER BY t.trip_date DESC, t.id DESC
      LIMIT 50
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, v.plate_number, v.model
      FROM fleet_expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT 50
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/trips', verifyToken, requireRole(['Admin', 'Fleet Manager', 'Driver']), async (req, res) => {
  try {
    const vehicle_id = Number(req.body.vehicle_id);
    const platform = String(req.body.platform || 'Uber').trim();
    const trip_date = req.body.trip_date || new Date().toISOString().slice(0, 10);
    const gross_earnings = Number(req.body.gross_earnings ?? req.body.revenue ?? 0);

    if (!vehicle_id || !Number.isFinite(gross_earnings) || gross_earnings < 0) {
      return res.status(400).json({ success: false, message: 'Vehicle selection and valid earnings value are required.' });
    }

    await db.query(
      'INSERT INTO fleet_trips (vehicle_id, platform, trip_date, gross_earnings) VALUES (?, ?, ?, ?)',
      [vehicle_id, platform, trip_date, gross_earnings]
    );

    return res.json({ success: true, message: 'Trip recorded successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/expenses', verifyToken, requireRole(['Admin', 'Fleet Manager']), async (req, res) => {
  try {
    const vehicle_id = Number(req.body.vehicle_id);
    const expense_type = String(req.body.expense_type || 'Fuel').trim();
    const amount = Number(req.body.amount);
    const expense_date = req.body.expense_date || new Date().toISOString().slice(0, 10);

    if (!vehicle_id || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'Vehicle and valid amount are required.' });
    }

    await db.query(
      'INSERT INTO fleet_expenses (vehicle_id, expense_type, amount, expense_date) VALUES (?, ?, ?, ?)',
      [vehicle_id, expense_type, amount, expense_date]
    );

    return res.json({ success: true, message: 'Expense logged successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;