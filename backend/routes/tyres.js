const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tyres ORDER BY id DESC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/sales/history', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ts.id, ts.tyre_id, t.brand, t.pattern, t.size, t.buying_price,
             ts.customer_name, ts.quantity_sold, ts.unit_price, ts.total_amount,
             ts.sale_date,
             ((ts.unit_price - t.buying_price) * ts.quantity_sold) AS gross_profit
      FROM tyre_sales ts
      JOIN tyres t ON t.id = ts.tyre_id
      ORDER BY ts.sale_date DESC, ts.id DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
    const customer_name = req.body.customer_name ? String(req.body.customer_name).trim() : 'Walk-in Customer';

    if (!tyre_id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(sale_price_per_unit) || sale_price_per_unit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: tyre ID, quantity, and sale price are required.'
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      const [tyreRows] = await connection.query('SELECT id, stock_quantity, buying_price, selling_price FROM tyres WHERE id = ? FOR UPDATE', [tyre_id]);
      const tyre = tyreRows[0];

      if (!tyre) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Tyre not found.' });
      }

      if (tyre.stock_quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Not enough stock available for this sale.' });
      }

      const finalUnitPrice = sale_price_per_unit > 0 ? sale_price_per_unit : Number(tyre.selling_price);
      const total_amount = quantity * finalUnitPrice;

      await connection.query(
        'UPDATE tyres SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [quantity, tyre_id]
      );

      await connection.query(
        'INSERT INTO tyre_sales (tyre_id, customer_name, quantity_sold, unit_price, total_amount) VALUES (?, ?, ?, ?, ?)',
        [tyre_id, customer_name, quantity, finalUnitPrice, total_amount]
      );

      await connection.commit();
      return res.json({ success: true, message: 'Sale recorded successfully.' });
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

router.delete('/sales/:saleId', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const saleId = Number(req.params.saleId);

    if (!saleId) {
      return res.status(400).json({ success: false, message: 'Sale ID is required.' });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      const [saleRows] = await connection.query('SELECT * FROM tyre_sales WHERE id = ? FOR UPDATE', [saleId]);
      const sale = saleRows[0];

      if (!sale) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Sale record not found.' });
      }

      await connection.query('UPDATE tyres SET stock_quantity = stock_quantity + ? WHERE id = ?', [sale.quantity_sold, sale.tyre_id]);
      await connection.query('DELETE FROM tyre_sales WHERE id = ?', [saleId]);

      await connection.commit();
      return res.json({ success: true, message: 'Sale deleted and stock restored.' });
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

router.delete('/:id', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM tyres WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;