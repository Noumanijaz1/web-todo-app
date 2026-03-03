const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Treat legacy 'user' role as 'employee'
function effectiveRole(role) {
  return role === 'user' ? 'employee' : role;
}

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    const role = user.role;
    req.user = { id: decoded.id, role, effectiveRole: effectiveRole(role) };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

exports.requireAdmin = (req, res, next) => {
  const role = req.user?.effectiveRole ?? req.user?.role;
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

exports.requireAdminOrPM = (req, res, next) => {
  const role = req.user?.effectiveRole ?? req.user?.role;
  if (role !== 'admin' && role !== 'project_manager') {
    return res.status(403).json({ success: false, message: 'Admin or Project Manager access required' });
  }
  next();
};

