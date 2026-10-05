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

module.exports = router;