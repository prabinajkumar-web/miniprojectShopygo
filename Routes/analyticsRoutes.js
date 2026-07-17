const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET all analytics data
router.get('/', analyticsController.getAnalytics);

// GET orders analytics
router.get('/orders', analyticsController.getOrdersAnalytics);

// GET daily summary
router.get('/daily', analyticsController.getDailySummary);

module.exports = router;