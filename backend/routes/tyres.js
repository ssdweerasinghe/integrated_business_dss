const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tyres ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', verifyToken, requireRole(['Admin', 'Shop Manager']), async (req, res) => {
  try {
    const { brand, pattern, size, buying_price, selling_price, stock_quantity } = req.body;
    await db.query(
      'INSERT INTO tyres (brand, pattern, size, buying_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [brand, pattern, size, buying_price, selling_price, stock_quantity]
    );
    res.json({ success: true, message: 'Tyre added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sell', verifyToken, requireRole(['Admin', 'Shop Manager']), async (req, res) => {
  try {
    const { tyre_id, quantity, sale_price_per_unit } = req.body;
    const total_amount = quantity * sale_price_per_unit;
    
    await db.query('UPDATE tyres SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, tyre_id]);
    await db.query(
      'INSERT INTO tyre_sales (tyre_id, quantity, sale_price_per_unit, total_amount) VALUES (?, ?, ?, ?)',
      [tyre_id, quantity, sale_price_per_unit, total_amount]
    );
    res.json({ success: true, message: 'Sale recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin-only deletion
router.delete('/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM tyres WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;