const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET all fleet vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST Register a new fleet vehicle
router.post('/vehicles', async (req, res) => {
  const { plate_number, model, driver_name, status } = req.body;
  if (!plate_number || !model) {
    return res.status(400).json({ success: false, message: 'License plate number and model are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO vehicles (plate_number, model, driver_name, status) VALUES (?, ?, ?, ?)',
      [plate_number, model, driver_name || null, status || 'Active']
    );
    res.status(201).json({ success: true, message: 'Vehicle registered successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST Record daily ride-hailing earnings (Uber / PickMe / Private)
router.post('/trips', async (req, res) => {
  const { vehicle_id, platform, trip_date, gross_earnings } = req.body;
  if (!vehicle_id || !platform || !gross_earnings || gross_earnings <= 0) {
    return res.status(400).json({ success: false, message: 'Vehicle, platform, and positive gross earnings are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO fleet_trips (vehicle_id, platform, trip_date, gross_earnings) VALUES (?, ?, ?, ?)',
      [vehicle_id, platform, trip_date || new Date().toISOString().slice(0, 10), gross_earnings]
    );
    res.status(201).json({ success: true, message: 'Trip earnings recorded', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. POST Log operational expenses (Fuel, Maintenance, Insurance, Repair)
router.post('/expenses', async (req, res) => {
  const { vehicle_id, expense_type, amount, description, expense_date } = req.body;
  if (!vehicle_id || !expense_type || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Vehicle, expense category, and amount are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO fleet_expenses (vehicle_id, expense_type, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, expense_type, amount, description || null, expense_date || new Date().toISOString().slice(0, 10)]
    );
    res.status(201).json({ success: true, message: 'Expense voucher logged', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ADMIN MANAGEMENT ROUTES ---

// 5. GET All trips and expenses with vehicle details for Admin inspection
router.get('/admin/records', async (req, res) => {
  try {
    const [trips] = await pool.query(`
      SELECT t.*, v.plate_number, v.model 
      FROM fleet_trips t 
      JOIN vehicles v ON t.vehicle_id = v.id 
      ORDER BY t.trip_date DESC, t.id DESC
    `);
    const [expenses] = await pool.query(`
      SELECT e.*, v.plate_number, v.model 
      FROM fleet_expenses e 
      JOIN vehicles v ON e.vehicle_id = v.id 
      ORDER BY e.expense_date DESC, e.id DESC
    `);
    res.json({ success: true, trips, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. DELETE a trip earning record
router.delete('/trips/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM fleet_trips WHERE id = ?', [id]);
    res.json({ success: true, message: 'Trip record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. DELETE an expense voucher
router.delete('/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM fleet_expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. DELETE a vehicle (and cascades to remove its linked trips & expenses)
router.delete('/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM fleet_trips WHERE vehicle_id = ?', [id]);
    await conn.query('DELETE FROM fleet_expenses WHERE vehicle_id = ?', [id]);
    await conn.query('DELETE FROM vehicles WHERE id = ?', [id]);
    await conn.commit();
    res.json({ success: true, message: 'Vehicle and all linked trip and expense records deleted' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;