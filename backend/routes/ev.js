const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET all charging points
router.get('/points', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM charging_points ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST Register a new charging point
router.post('/points', async (req, res) => {
  const { name, charger_type, rate_per_kwh, status } = req.body;
  if (!name || !charger_type || !rate_per_kwh) {
    return res.status(400).json({ success: false, message: 'Name, charger type, and tariff rate are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO charging_points (name, charger_type, rate_per_kwh, status) VALUES (?, ?, ?, ?)',
      [name, charger_type, rate_per_kwh, status || 'Available']
    );
    res.status(201).json({ success: true, message: 'Charging point registered', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET all charging sessions (with point details)
router.get('/sessions', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, p.name AS charging_point_name, p.rate_per_kwh, p.charger_type
      FROM charging_sessions s
      JOIN charging_points p ON s.point_id = p.id
      ORDER BY s.start_time DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. POST Record a vehicle charging session & calculate tariff fee
router.post('/sessions', async (req, res) => {
  const { point_id, vehicle_number, energy_consumed_kwh } = req.body;
  if (!point_id || !energy_consumed_kwh || energy_consumed_kwh <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid charging session details.' });
  }

  try {
    // Fetch point tariff rate
    const [points] = await pool.query('SELECT rate_per_kwh FROM charging_points WHERE id = ?', [point_id]);
    if (points.length === 0) {
      return res.status(404).json({ success: false, message: 'Charging point not found.' });
    }

    const rate = points[0].rate_per_kwh;
    const total_amount = rate * energy_consumed_kwh;

    const [result] = await pool.query(
      'INSERT INTO charging_sessions (point_id, vehicle_number, energy_consumed_kwh, total_amount) VALUES (?, ?, ?, ?)',
      [point_id, vehicle_number || 'Unregistered', energy_consumed_kwh, total_amount]
    );

    res.status(201).json({
      success: true,
      message: 'Charging session recorded',
      sessionId: result.insertId,
      total_amount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ADMIN MANAGEMENT ROUTES ---

// 5. DELETE an individual charging session
router.delete('/sessions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM charging_sessions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Charging session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. DELETE a charging point and its linked session history
router.delete('/points/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM charging_sessions WHERE point_id = ?', [id]);
    await conn.query('DELETE FROM charging_points WHERE id = ?', [id]);
    await conn.commit();
    res.json({ success: true, message: 'Charging point and all associated sessions deleted' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;