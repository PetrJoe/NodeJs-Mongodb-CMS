const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const authorizeOwnershipOrAdmin = (resourceField = 'author') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = req.resource?.[resourceField]?.toString() ||
                          req.params.userId ||
                          req.body[resourceField];

    if (!resourceUserId || resourceUserId !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnershipOrAdmin
};