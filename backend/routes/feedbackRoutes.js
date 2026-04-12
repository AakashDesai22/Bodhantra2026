const express = require('express');
const router = express.Router();
const { submitFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitFeedback);

module.exports = router;
