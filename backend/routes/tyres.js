const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET all tyres in inventory
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tyres ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET complete sales history with cost and gross profit per transaction
router.get('/sales/history', async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT 
        s.id,
        s.customer_name,
        s.quantity_sold,
        s.unit_price,
        s.total_amount,
        s.sale_date,
        t.brand,
        t.pattern,
        t.size,
        t.buying_price,
        ((s.unit_price - t.buying_price) * s.quantity_sold) AS gross_profit
      FROM tyre_sales s
      JOIN tyres t ON s.tyre_id = t.id
      ORDER BY s.sale_date DESC
    `);
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST Add new tyre stock to inventory
router.post('/', async (req, res) => {
  const { brand, pattern, size, buying_price, selling_price, stock_quantity } = req.body;
  if (!brand || !size || !buying_price || !selling_price || stock_quantity === undefined) {
    return res.status(400).json({ success: false, message: 'All required tyre fields must be filled.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tyres (brand, pattern, size, buying_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [brand, pattern || null, size, buying_price, selling_price, stock_quantity]
    );
    res.status(201).json({ success: true, message: 'Tyre added successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. POST Record a POS Sale (Row-locked ACID Transaction)
router.post('/sale', async (req, res) => {
  const { tyre_id, quantity_sold, customer_name } = req.body;
  if (!tyre_id || !quantity_sold || quantity_sold <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid sale parameters.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the tyre row to check current stock
    const [tyres] = await conn.query('SELECT * FROM tyres WHERE id = ? FOR UPDATE', [tyre_id]);
    if (tyres.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Tyre product not found.' });
    }

    const tyre = tyres[0];
    if (tyre.stock_quantity < quantity_sold) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory. Available: ${tyre.stock_quantity}, Requested: ${quantity_sold}`
      });
    }

    const unit_price = tyre.selling_price;
    const total_amount = unit_price * quantity_sold;

    // Decrement stock
    await conn.query('UPDATE tyres SET stock_quantity = stock_quantity - ? WHERE id = ?', [
      quantity_sold,
      tyre_id
    ]);

    // Insert sale record
    const [saleResult] = await conn.query(
      'INSERT INTO tyre_sales (tyre_id, quantity_sold, unit_price, total_amount, customer_name) VALUES (?, ?, ?, ?, ?)',
      [tyre_id, quantity_sold, unit_price, total_amount, customer_name || 'Walk-in Customer']
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Sale recorded and inventory decremented successfully',
      saleId: saleResult.insertId
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// --- ADMIN / EDIT MANAGEMENT ROUTES ---

// 5. PUT Update Tyre details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { brand, pattern, size, buying_price, selling_price, stock_quantity } = req.body;
  try {
    await pool.query(
      `UPDATE tyres 
       SET brand = ?, pattern = ?, size = ?, buying_price = ?, selling_price = ?, stock_quantity = ? 
       WHERE id = ?`,
      [brand, pattern, size, buying_price, selling_price, stock_quantity, id]
    );
    res.json({ success: true, message: 'Tyre updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. DELETE Tyre (and cascade-removes its associated sales records safely)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM tyre_sales WHERE tyre_id = ?', [id]);
    await conn.query('DELETE FROM tyres WHERE id = ?', [id]);
    await conn.commit();
    res.json({ success: true, message: 'Tyre and linked sales records removed' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// 7. DELETE Sale record (Restores the stock quantity to inventory)
router.delete('/sales/:saleId', async (req, res) => {
  const { saleId } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [sales] = await conn.query('SELECT tyre_id, quantity_sold FROM tyre_sales WHERE id = ?', [saleId]);
    if (sales.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Sale record not found' });
    }
    const { tyre_id, quantity_sold } = sales[0];

    // Rollback stock
    await conn.query('UPDATE tyres SET stock_quantity = stock_quantity + ? WHERE id = ?', [quantity_sold, tyre_id]);
    
    // Delete sale
    await conn.query('DELETE FROM tyre_sales WHERE id = ?', [saleId]);
    await conn.commit();
    res.json({ success: true, message: 'Sale deleted and stock restored successfully' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// 8. GET all sales for Admin management view
router.get('/admin/sales', async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT s.*, t.brand, t.size 
      FROM tyre_sales s 
      JOIN tyres t ON s.tyre_id = t.id 
      ORDER BY s.sale_date DESC
    `);
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;