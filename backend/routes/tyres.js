const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. GET all tyres
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tyres ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST add a new tyre to inventory
router.post('/', async (req, res) => {
  const { brand, pattern, size, stock_quantity, buying_price, selling_price } = req.body;

  if (!brand || !size || stock_quantity === undefined || !buying_price || !selling_price) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tyres (brand, pattern, size, stock_quantity, buying_price, selling_price) VALUES (?, ?, ?, ?, ?, ?)',
      [brand, pattern, size, stock_quantity, buying_price, selling_price]
    );
    res.status(201).json({
      success: true,
      message: 'Tyre added successfully',
      tyreId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST record a tyre sale & decrement stock
router.post('/sale', async (req, res) => {
  const { tyre_id, customer_name, quantity_sold } = req.body;

  if (!tyre_id || !quantity_sold || quantity_sold <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid tyre or quantity.' });
  }

  // Get a dedicated connection from the pool for a transaction
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch current tyre details
    const [rows] = await connection.query('SELECT stock_quantity, selling_price FROM tyres WHERE id = ? FOR UPDATE', [tyre_id]);
    
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Tyre not found.' });
    }

    const tyre = rows[0];

    // Check inventory
    if (tyre.stock_quantity < quantity_sold) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient stock available.' });
    }

    const unit_price = tyre.selling_price;
    const total_amount = unit_price * quantity_sold;

    // 1. Record the sale
    await connection.query(
      'INSERT INTO tyre_sales (tyre_id, customer_name, quantity_sold, unit_price, total_amount) VALUES (?, ?, ?, ?, ?)',
      [tyre_id, customer_name || 'Walk-in Customer', quantity_sold, unit_price, total_amount]
    );

    // 2. Reduce the stock quantity
    await connection.query(
      'UPDATE tyres SET stock_quantity = stock_quantity - ? WHERE id = ?',
      [quantity_sold, tyre_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        customer_name: customer_name || 'Walk-in Customer',
        quantity_sold,
        total_amount
      }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;