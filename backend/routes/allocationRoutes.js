const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
    getGrid, updateGrid,
    getRules, updateRules,
    generate, preview, lock,
    revealOwn, revealForUser, getParticipantsList,
    assignSingleParticipant
} = require('../controllers/allocationController');

// Admin READ routes — admin + member
router.get('/:eventId/grid', protect, requireRole(['admin', 'member']), getGrid);
router.get('/:eventId/rules', protect, requireRole(['admin', 'member']), getRules);
router.get('/:eventId/reveal/:userId', protect, requireRole(['admin', 'member']), revealForUser);
router.get('/:eventId/participants', protect, requireRole(['admin', 'member']), getParticipantsList);

// Admin WRITE routes — admin only
router.put('/:eventId/grid', protect, requireRole(['admin', 'member']), updateGrid);
router.put('/:eventId/rules', protect, requireRole(['admin', 'member']), updateRules);
router.post('/:eventId/assign-single/:userId', protect, requireRole(['admin', 'member']), assignSingleParticipant);

// Participant Routes
router.get('/:eventId/reveal', protect, revealOwn);

module.exports = router;
