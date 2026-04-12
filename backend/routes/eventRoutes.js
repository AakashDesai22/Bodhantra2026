const express = require('express');
const router = express.Router();
const { getEvents, getEventBySlug, getAllEventsAdmin, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const eventUpload = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
    { name: 'qr_code', maxCount: 1 },
]);

// Admin routes MUST come before /:slug to avoid "admin" being treated as a slug
router.get('/admin/all', protect, requireRole(['admin', 'member']), getAllEventsAdmin);
router.post('/admin/create', protect, requireRole(['admin']), eventUpload, createEvent);
router.patch('/admin/:id', protect, requireRole(['admin']), eventUpload, updateEvent);
router.delete('/admin/:id', protect, requireRole(['admin']), deleteEvent);

// Public routes
router.get('/', getEvents);
router.get('/:slug', getEventBySlug);

module.exports = router;
