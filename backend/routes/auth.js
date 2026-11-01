const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const identifier = (req.body.email || req.body.username || '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/username and password.'
      });
    }

    // Support lookup by either email OR username
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const user = users[0];

    // Verify password via bcrypt hash or plain text fallback
    let isMatch = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'integrated_business_dss_jwt_secret_key',
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.username.toUpperCase(),
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Authentication Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Authentication server error: ' + err.message
    });
  }
});

// GET /api/auth/users (for AdminManager module)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY id ASC'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register (for AdminManager user creation)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'Driver';

    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username.trim(), email.trim(), hashedPassword, userRole]
    );

    return res.json({
      success: true,
      message: `User ${username} successfully registered.`,
      userId: result.insertId
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;