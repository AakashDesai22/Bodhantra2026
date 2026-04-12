const express = require('express');
const router = express.Router();
const { sendOtp, sendBulkEmails } = require('../controllers/emailController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Public route for registration OTP
router.post('/send-otp', sendOtp);

// Protected admin route for bulk emails
router.post('/send-bulk', protect, requireRole(['admin']), sendBulkEmails);

module.exports = router;
