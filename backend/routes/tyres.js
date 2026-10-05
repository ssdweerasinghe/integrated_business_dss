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

// 2. POST Add new tyre stock
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

// 3. POST Record a POS Sale (Transaction-Safe)
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

    // Insert sale transaction
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

// --- ADMIN MANAGEMENT ROUTES ---

// 4. PUT Update tyre details
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

// 5. DELETE Tyre and linked sales records
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

// 6. DELETE Sale record (Restores stock quantity)
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
    // Delete sale entry
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

// 7. GET all sales for Admin management
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