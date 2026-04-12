const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getAnalytics,
    getAllRegistrations,
    getRegistrationDetails,
    updateRegistrationStatus,
    toggleAttendance,
    getAllQueries,
    respondToQuery,
    updateParticipant,
    resendQRCode,
    manualAddParticipant,
    deleteParticipant,
    resetPlatform,
    uploadAdminPhoto,
    getSystemLogs,
} = require('../controllers/adminController');
const { scanQR, getAttendanceReport, markAttendance, getSessionRoster, toggleSessionAttendance } = require('../controllers/attendanceController');
const { inviteMember, getAllUsers, updateUserRole, updateUserDetails, deleteUser } = require('../controllers/inviteController');
const { updateSupportConfig } = require('../controllers/configController');

// All routes require authentication
router.use(protect);

// Apply Audit Logging to all admin actions
router.use(auditMiddleware);

// ─── READ-ONLY routes: admin + member ────────────────────────────
router.get('/analytics', requireRole(['admin', 'member']), getAnalytics);
router.get('/registrations', requireRole(['admin', 'member']), getAllRegistrations);
router.get('/registrations/:id', requireRole(['admin', 'member']), getRegistrationDetails);
router.get('/queries', requireRole(['admin', 'member']), getAllQueries);
router.get('/attendance/report/:event_id', requireRole(['admin', 'member']), getAttendanceReport);
router.get('/attendance/roster/:eventId/:sessionId', requireRole(['admin', 'member']), getSessionRoster);

// ─── READ-ONLY routes: admin only ────────────────────────────────
router.get('/logs', requireRole(['admin']), getSystemLogs);

// ─── WRITE routes: admin only ────────────────────────────────────
router.patch('/registrations/:id/status', requireRole(['admin']), updateRegistrationStatus);
router.patch('/registrations/:id/attendance', requireRole(['admin']), toggleAttendance);
router.patch('/registrations/:id/resend-qr', requireRole(['admin']), resendQRCode);
router.post('/manual-add-participant', requireRole(['admin']), manualAddParticipant);
router.delete('/participant/:id', requireRole(['admin']), deleteParticipant);
router.patch('/queries/:id/respond', requireRole(['admin']), respondToQuery);
router.patch('/participant/:id', requireRole(['admin']), updateParticipant);
router.post('/danger/reset-platform', requireRole(['admin']), resetPlatform);
router.post('/upload-photo', requireRole(['admin', 'member']), upload.single('photo'), uploadAdminPhoto);
router.put('/config/support', requireRole(['admin']), updateSupportConfig);

// Attendance / Scanner
router.post('/attendance/scan', requireRole(['admin', 'member']), scanQR);
router.post('/attendance/mark', requireRole(['admin', 'member']), markAttendance);
router.post('/attendance/toggle', requireRole(['admin', 'member']), toggleSessionAttendance);

// ─── User Management routes: admin only ──────────────────────────
router.post('/invite', requireRole(['admin']), inviteMember);
router.get('/users', requireRole(['admin']), getAllUsers);
router.patch('/users/:id/role', requireRole(['admin']), updateUserRole);
router.patch('/users/:id', requireRole(['admin']), updateUserDetails);
router.delete('/users/:id', requireRole(['admin']), deleteUser);

// ─── Feedback Configuration routes: admin only ───────────────────
const { updateFeedbackConfig, sendFeedbackEmailBlast, getEventFeedback, toggleFeedbackVisibility, deleteFeedback, resetEventFeedback } = require('../controllers/adminController');
router.put('/events/:id/feedback-config', requireRole(['admin']), updateFeedbackConfig);
router.post('/events/:id/send-feedback-email', requireRole(['admin']), sendFeedbackEmailBlast);
router.get('/events/:id/feedback', requireRole(['admin', 'member']), getEventFeedback);
router.patch('/feedback/:id/toggle-visibility', requireRole(['admin']), toggleFeedbackVisibility);
router.delete('/feedback/:id', requireRole(['admin']), deleteFeedback);
router.delete('/events/:eventId/feedback/reset', requireRole(['admin']), resetEventFeedback);

// ─── Certificate Configuration routes: admin only ────────────────
const { saveCertificateConfig, issueCertificates } = require('../controllers/certificateController');
router.put('/events/:id/certificate-config', requireRole(['admin']), saveCertificateConfig);
router.post('/events/:id/issue-certificates', requireRole(['admin']), issueCertificates);

module.exports = router;
