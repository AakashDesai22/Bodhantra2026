const express = require('express');
const router = express.Router();
const { createQuery, getMyQueries } = require('../controllers/queryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createQuery);
router.route('/my').get(protect, getMyQueries);

module.exports = router;
