const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'integrated_business_dss_jwt_secret_key';
const VALID_ROLES = new Set([
  'Admin',
  'Owner',
  'Shop Manager',
  'EV Operator',
  'EV System Manager',
  'EV Manager',
  'Fleet Manager',
  'Fleet Operation Manager',
  'Driver',
  'Accountant'
]);

const normalizeRole = (role) => {
  const value = String(role || '').trim();
  return VALID_ROLES.has(value) ? value : null;
};

const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id ASC'
    );

    const formatted = rows.map((user) => ({
      ...user,
      username: user.name,
      name: user.name
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;
    const submittedName = String(name || username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = normalizeRole(role) || 'Driver';

    if (!submittedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [submittedName, normalizedEmail, hashedPassword, normalizedRole]
    );

    return res.json({
      success: true,
      message: `User ${submittedName} successfully registered.`,
      userId: result.insertId
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = String(req.body.email || req.body.username || '').trim().toLowerCase();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/username and password.'
      });
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = users[0];
    const isMatch = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.name,
        name: user.name,
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

module.exports = router;
module.exports.requireAdmin = requireAdmin;