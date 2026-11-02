const jwt = require('jsonwebtoken');

const roleAliases = {
  'EV Manager': ['EV System Manager', 'EV Operator'],
  'EV System Manager': ['EV Manager', 'EV Operator'],
  'EV Operator': ['EV Manager', 'EV System Manager'],
  'Fleet Operation Manager': ['Fleet Manager'],
  'Fleet Manager': ['Fleet Operation Manager'],
  'Shop Manager': ['Shop Manager'],
  'Owner': ['Owner'],
  'Admin': ['Admin']
};

const userHasRole = (userRole, allowedRoles) => {
  const aliases = new Set([userRole, ...(roleAliases[userRole] || [])]);
  return allowedRoles.some((role) => aliases.has(role));
};

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ success: false, message: 'No token provided' });

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'integrated_business_dss_jwt_secret_key', (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !userHasRole(req.user.role, roles)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole, userHasRole };