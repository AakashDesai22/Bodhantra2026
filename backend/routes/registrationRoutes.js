const express = require('express');
const router = express.Router();
const {
    registerForEvent,
    createRegistration,
    getMyRegistrations,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public: register for event (auto-creates account)
router.post('/event/:event_id', upload.single('payment_ss'), registerForEvent);

// Protected: manual registration for logged-in users
router.route('/').post(protect, upload.single('payment_ss'), createRegistration);
router.route('/my').get(protect, getMyRegistrations);

module.exports = router;
