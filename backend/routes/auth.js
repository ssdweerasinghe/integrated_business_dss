const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-dss-secret-change-me';
const VALID_ROLES = new Set([
  'Owner',
  'Admin',
  'Shop Manager',
  'EV Operator',
  'EV System Manager',
  'Fleet Manager',
  'Fleet Operation Manager',
  'Driver',
  'Accountant'
]);

const normalizeRole = (role) => {
  if (!role) return null;
  const trimmed = String(role).trim();
  return VALID_ROLES.has(trimmed) ? trimmed : null;
};

// 1. POST Register a user
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = normalizeRole(role);

  if (!name || !normalizedEmail || !password || !normalizedRole) {
    return res.status(400).json({ success: false, message: 'Please provide a valid name, email, password and role.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [String(name).trim(), normalizedEmail, hashedPassword, normalizedRole]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST Login user
router.post('/login', async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = String(email || username || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email/username and password.' });
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;