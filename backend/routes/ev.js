const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/points', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM charging_points ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/points', verifyToken, requireRole(['Admin', 'EV System Manager']), async (req, res) => {
  try {
    const { name, charger_type, rate_per_kwh } = req.body;
    await db.query(
      'INSERT INTO charging_points (name, charger_type, rate_per_kwh) VALUES (?, ?, ?)',
      [name, charger_type, rate_per_kwh]
    );
    res.json({ success: true, message: 'Bay added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/charge', verifyToken, requireRole(['Admin', 'EV System Manager', 'EV Operator']), async (req, res) => {
  try {
    const { charging_point_id, vehicle_number, energy_consumed_kwh, rate_per_kwh, total_amount } = req.body;
    await db.query(
      'INSERT INTO charging_sessions (charging_point_id, vehicle_number, energy_consumed_kwh, rate_per_kwh, total_amount) VALUES (?, ?, ?, ?, ?)',
      [charging_point_id, vehicle_number, energy_consumed_kwh, rate_per_kwh, total_amount]
    );
    res.json({ success: true, message: 'Session logged' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;