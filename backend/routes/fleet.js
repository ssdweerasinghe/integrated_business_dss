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

router.post('/vehicles', verifyToken, requireRole(['Admin', 'Fleet Manager']), async (req, res) => {
  try {
    const { plate_number, model, driver_name, status } = req.body;
    if (!plate_number || !model || !driver_name) {
      return res.status(400).json({ success: false, message: 'Plate number, model, and driver are required.' });
    }

    const [existing] = await db.query('SELECT id FROM vehicles WHERE plate_number = ? LIMIT 1', [String(plate_number).trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Vehicle with that plate number is already registered.' });
    }

    await db.query(
      'INSERT INTO vehicles (plate_number, model, driver_name, status) VALUES (?, ?, ?, ?)',
      [String(plate_number).trim(), String(model).trim(), String(driver_name).trim(), status || 'Active']
    );

    return res.json({ success: true, message: 'Vehicle registered successfully.' });
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

router.get('/admin/records', async (req, res) => {
  try {
    const [tripSummary] = await db.query('SELECT COALESCE(SUM(gross_earnings), 0) AS gross_earnings FROM fleet_trips');
    const [expenseSummary] = await db.query('SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM fleet_expenses');
    const [vehicleRows] = await db.query('SELECT COUNT(*) AS active_vehicles FROM vehicles WHERE status = "Active"');

    const gross = Number(tripSummary[0]?.gross_earnings || 0);
    const expenses = Number(expenseSummary[0]?.total_expenses || 0);
    const activeVehicles = Number(vehicleRows[0]?.active_vehicles || 0);
    const netYield = gross - expenses;
    const operatingRatio = gross > 0 ? (expenses / gross) * 100 : 0;

    return res.json({
      success: true,
      data: {
        gross_earnings: gross,
        total_expenses: expenses,
        net_yield: netYield,
        operating_ratio_percent: operatingRatio,
        active_vehicles: activeVehicles
      }
    });
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

router.delete('/trips/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const tripId = Number(req.params.id);
    if (!tripId) {
      return res.status(400).json({ success: false, message: 'Trip ID is required.' });
    }

    await db.query('DELETE FROM fleet_trips WHERE id = ?', [tripId]);
    return res.json({ success: true, message: 'Trip record removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/expenses/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const expenseId = Number(req.params.id);
    if (!expenseId) {
      return res.status(400).json({ success: false, message: 'Expense ID is required.' });
    }

    await db.query('DELETE FROM fleet_expenses WHERE id = ?', [expenseId]);
    return res.json({ success: true, message: 'Expense record removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/vehicles/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required.' });
    }

    await db.query('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
    return res.json({ success: true, message: 'Vehicle removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;