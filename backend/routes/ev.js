const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET all charging points and their current status
router.get('/points', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM charging_points');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET all completed charging sessions
router.get('/sessions', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, p.name AS charging_point_name, p.charger_type 
      FROM charging_sessions s
      JOIN charging_points p ON s.point_id = p.id
      ORDER BY s.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST record a completed charging session
router.post('/sessions', async (req, res) => {
  const { point_id, vehicle_number, energy_consumed_kwh } = req.body;

  if (!point_id || !vehicle_number || !energy_consumed_kwh || energy_consumed_kwh <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide valid charging details.' });
  }

  try {
    // Look up the rate for this specific charging point
    const [points] = await pool.query('SELECT rate_per_kwh FROM charging_points WHERE id = ?', [point_id]);
    
    if (points.length === 0) {
      return res.status(404).json({ success: false, message: 'Charging point not found.' });
    }

    const rate = points[0].rate_per_kwh;
    const total_amount = rate * energy_consumed_kwh;

    const [result] = await pool.query(
      'INSERT INTO charging_sessions (point_id, vehicle_number, energy_consumed_kwh, rate_per_kwh, total_amount) VALUES (?, ?, ?, ?, ?)',
      [point_id, vehicle_number, energy_consumed_kwh, rate, total_amount]
    );

    res.status(201).json({
      success: true,
      message: 'Charging session recorded',
      sessionId: result.insertId,
      data: {
        vehicle_number,
        energy_consumed_kwh,
        rate_per_kwh: rate,
        total_amount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;