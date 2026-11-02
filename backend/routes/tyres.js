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

    if (!brand || !size || buying_price === undefined || selling_price === undefined || stock_quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Brand, size, buying price, selling price, and stock quantity are required.' });
    }

    await db.query(
      'INSERT INTO tyres (brand, pattern, size, buying_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [String(brand).trim(), pattern ? String(pattern).trim() : '', String(size).trim(), Number(buying_price), Number(selling_price), Number(stock_quantity)]
    );

    return res.json({ success: true, message: 'Tyre added successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sale', verifyToken, requireRole(['Admin', 'Shop Manager']), async (req, res) => {
  try {
    const tyre_id = Number(req.body.tyre_id);
    const quantity = Number(req.body.quantity);
    const sale_price_per_unit = Number(req.body.sale_price_per_unit ?? req.body.unit_price ?? 0);
    const customer_name = req.body.customer_name ? String(req.body.customer_name).trim() : null;

    if (!tyre_id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(sale_price_per_unit) || sale_price_per_unit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: tyre ID, quantity, and sale price are required.'
      });
    }

    const [rows] = await db.query('SELECT id, stock_quantity, selling_price FROM tyres WHERE id = ?', [tyre_id]);
    const tyre = rows[0];

    if (!tyre) {
      return res.status(404).json({ success: false, message: 'Tyre not found.' });
    }

    if (tyre.stock_quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock available for this sale.' });
    }

    const finalUnitPrice = sale_price_per_unit > 0 ? sale_price_per_unit : Number(tyre.selling_price);
    const total_amount = quantity * finalUnitPrice;

    await db.query(
      'UPDATE tyres SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
      [quantity, tyre_id, quantity]
    );

    await db.query(
      'INSERT INTO tyre_sales (tyre_id, customer_name, quantity_sold, unit_price, total_amount) VALUES (?, ?, ?, ?, ?)',
      [tyre_id, customer_name, quantity, finalUnitPrice, total_amount]
    );

    return res.json({ success: true, message: 'Sale recorded successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM tyres WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;