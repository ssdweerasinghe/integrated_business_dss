const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => {
  try {
    const submittedByRole = String(req.user?.role || req.body.role || '').trim();
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();

    if (!submittedByRole || !title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const allowedRoles = ['Shop Manager', 'EV Operator', 'EV System Manager', 'EV Manager', 'Fleet Manager', 'Fleet Operation Manager'];
    const matches = allowedRoles.includes(submittedByRole) || allowedRoles.includes(req.user?.role);
    if (!matches) {
      return res.status(403).json({ success: false, message: 'Only operational managers can submit inquiries.' });
    }

    await db.query(
      'INSERT INTO inquiries (submitted_by_role, title, content) VALUES (?, ?, ?)',
      [submittedByRole, title, content]
    );

    return res.json({ success: true, message: 'Inquiry submitted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', verifyToken, requireRole(['Admin']), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM inquiries ORDER BY created_at DESC'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
