const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST record daily earnings/trip
router.post('/trips', async (req, res) => {
  const { vehicle_id, platform, trip_date, gross_earnings } = req.body;

  if (!vehicle_id || !trip_date || gross_earnings === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide vehicle ID, date, and gross earnings.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO fleet_trips (vehicle_id, platform, trip_date, gross_earnings) VALUES (?, ?, ?, ?)',
      [vehicle_id, platform || 'Uber', trip_date, gross_earnings]
    );

    res.status(201).json({
      success: true,
      message: 'Trip earnings recorded',
      tripId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST record fleet expense
router.post('/expenses', async (req, res) => {
  const { vehicle_id, expense_type, amount, expense_date, description } = req.body;

  if (!vehicle_id || !expense_type || !amount || !expense_date) {
    return res.status(400).json({ success: false, message: 'Please provide vehicle ID, expense type, amount, and date.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO fleet_expenses (vehicle_id, expense_type, amount, expense_date, description) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, expense_type, amount, expense_date, description || '']
    );

    res.status(201).json({
      success: true,
      message: 'Expense recorded',
      expenseId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;