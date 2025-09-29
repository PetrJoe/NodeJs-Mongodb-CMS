const express = require('express');
const {
  getDashboardStats,
  getContentStats,
  getAnalytics
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, authorize('admin', 'editor'), getDashboardStats);

router.get('/content-stats', authenticate, getContentStats);

router.get('/analytics', authenticate, authorize('admin', 'editor'), getAnalytics);

module.exports = router;