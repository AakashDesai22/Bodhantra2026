const express = require('express');
const router = express.Router();
const { getSupportConfig } = require('../controllers/configController');
const { protect } = require('../middleware/authMiddleware');

// General support configuration (can be accessed by logged-in users, maybe add protect)
// Depending on requirement, we can make it public or protected. User requested "Public/Protected route". Let's use protect since it's for participants.
router.get('/support', protect, getSupportConfig);

module.exports = router;
