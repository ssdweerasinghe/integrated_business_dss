const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/points', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM charging_points ORDER BY id ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/points', verifyToken, requireRole(['Admin', 'EV System Manager']), async (req, res) => {
  try {
    const { name, charger_type, rate_per_kwh } = req.body;

    if (!name || !charger_type || rate_per_kwh === undefined) {
      return res.status(400).json({ success: false, message: 'Bay name, charger type, and rate per kWh are required.' });
    }

    await db.query(
      'INSERT INTO charging_points (name, charger_type, rate_per_kwh, status) VALUES (?, ?, ?, ?)',
      [String(name).trim(), String(charger_type).trim(), Number(rate_per_kwh), 'Available']
    );

    return res.json({ success: true, message: 'Bay added successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/points/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const pointId = Number(req.params.id);
    if (!pointId) {
      return res.status(400).json({ success: false, message: 'Charging point ID is required.' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM charging_sessions WHERE point_id = ?', [pointId]);
      await connection.query('DELETE FROM charging_points WHERE id = ?', [pointId]);
      await connection.commit();
      return res.json({ success: true, message: 'Charging point removed.' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

const recordSession = async (req, res) => {
  try {
    const point_id = Number(req.body.point_id ?? req.body.charging_point_id);
    const vehicle_number = String(req.body.vehicle_number || 'Unregistered').trim();
    const energy_consumed_kwh = Number(req.body.energy_consumed_kwh);
    const rate_per_kwh = Number(req.body.rate_per_kwh);
    const total_amount = Number(req.body.total_amount ?? energy_consumed_kwh * rate_per_kwh);

    if (!point_id || !Number.isFinite(energy_consumed_kwh) || energy_consumed_kwh <= 0 || !Number.isFinite(rate_per_kwh) || rate_per_kwh <= 0) {
      return res.status(400).json({ success: false, message: 'Valid point, energy used, and rate are required.' });
    }

    const [pointRows] = await db.query('SELECT id, name FROM charging_points WHERE id = ?', [point_id]);
    if (!pointRows.length) {
      return res.status(404).json({ success: false, message: 'Charging point not found.' });
    }

    await db.query(
      'INSERT INTO charging_sessions (point_id, vehicle_number, energy_consumed_kwh, rate_per_kwh, total_amount) VALUES (?, ?, ?, ?, ?)',
      [point_id, vehicle_number || 'Unregistered', energy_consumed_kwh, rate_per_kwh, total_amount]
    );

    await db.query('UPDATE charging_points SET status = ? WHERE id = ?', ['Charging', point_id]);

    return res.json({ success: true, message: 'Charging session logged successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/charge', verifyToken, requireRole(['Admin', 'EV System Manager', 'EV Operator']), recordSession);
router.post('/sessions', verifyToken, requireRole(['Admin', 'EV System Manager', 'EV Operator']), recordSession);

router.get('/sessions', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT s.*, p.name AS bay_name FROM charging_sessions s LEFT JOIN charging_points p ON p.id = s.point_id ORDER BY s.id DESC LIMIT 50'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/sessions/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }

    await db.query('DELETE FROM charging_sessions WHERE id = ?', [sessionId]);
    return res.json({ success: true, message: 'Charging session deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;