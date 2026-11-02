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

router.post('/sale', verifyToken, requireRole(['Admin', 'Shop Manager']), async (req, res) => {
  try {
    const tyre_id = req.body.tyre_id;
    const quantity = Number(req.body.quantity);
    const sale_price_per_unit = Number(req.body.sale_price_per_unit);

    if (!tyre_id || isNaN(quantity) || isNaN(sale_price_per_unit)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payload: Missing or malformed tyre ID, quantity, or price.' 
      });
    }

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

router.delete('/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM tyres WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;