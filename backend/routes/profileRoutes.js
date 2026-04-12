const express = require('express');
const router = express.Router();
const { getMyProfile, updateProfile, uploadProfilePicture } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect); // All profile routes protected by token

router.get('/', getMyProfile);
router.put('/', updateProfile);
router.post('/picture', upload.single('photo'), uploadProfilePicture);

module.exports = router;
