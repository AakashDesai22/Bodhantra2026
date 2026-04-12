const crypto = require('crypto');
const { Registration, Event, User, Attendance, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Verify HMAC-signed QR token
const verifyQRToken = (token) => {
    const parts = token.split(':');
    if (parts.length !== 3) return null;

    const [uniqueId, eventId, providedHmac] = parts;
    const data = `${uniqueId}:${eventId}`;
    const expectedHmac = crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('hex');

    if (providedHmac !== expectedHmac) return null;

    return {
        uniqueId,
        eventId: parseInt(eventId),
    };
};

// ─── NEW: Mark Attendance (Session-Aware with 3-Branch Logic) ────────
const markAttendance = async (req, res) => {
    try {
        const { qr_data, sessionId } = req.body;

        if (!qr_data) {
            return res.status(400).json({ message: 'QR data is required', success: false });
        }

        // Verify QR token
        const decoded = verifyQRToken(qr_data);
        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or tampered QR code', success: false });
        }

        // Find user by unique_id
        const user = await User.findOne({ where: { unique_id: decoded.uniqueId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        const isAdminBadge = user.unique_id.includes('-ADM-');

        // Find registration
        const registration = await Registration.findOne({
            where: { user_id: user.id, event_id: decoded.eventId },
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'unique_id'] },
                { model: Event, attributes: ['id', 'name', 'date', 'event_duration', 'attendance_sessions'] }
            ]
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found for this event', success: false, isAdminBadge });
        }

        if (registration.status !== 'approved') {
            return res.status(400).json({ message: 'Registration is not approved', success: false, isAdminBadge });
        }

        const event = registration.Event;
        const sessions = event.attendance_sessions || [];
        const hasSessions = sessions.length > 0;

        // ─── BRANCH 1: New System (sessionId present) ───
        if (sessionId) {
            const session = sessions.find(s => s.id === sessionId);
            if (!session) {
                return res.status(400).json({
                    message: 'Invalid session ID. This session does not exist for the event.',
                    success: false,
                });
            }

            // Idempotency check for this specific session
            const existing = await Attendance.findOne({
                where: {
                    registration_id: registration.id,
                    session_id: sessionId,
                }
            });

            if (existing) {
                return res.status(200).json({
                    message: `WARNING: ${registration.User.name} is already checked in for this session.`,
                    success: true,
                    alreadyMarked: true,
                    participant: registration.User.name,
                    uniqueId: registration.User.unique_id,
                    sessionName: session.sessionName,
                    dayNumber: session.day,
                    scannedAt: existing.scanned_at,
                    isAdminBadge,
                });
            }

            // Create attendance record
            const attendance = await Attendance.create({
                registration_id: registration.id,
                day_number: session.day,
                session_id: sessionId,
                scanned_at: new Date(),
            });

            // Also mark legacy attendance boolean
            if (!registration.attendance) {
                registration.attendance = true;
                await registration.save();
            }

            AuditLog.create({
                userId: req.user ? req.user.id : null,
                userName: req.user ? req.user.name : 'System Scanner',
                userRole: req.user ? req.user.role : 'System',
                action: 'Attendance Marked',
                target: `Registration [${registration.id}] - Session [${session.sessionName}]`,
                ipAddress: req.ip || req.connection.remoteAddress
            }).catch(err => console.error('AuditLog Error:', err));

            // Send check-in email in background
            const { sendTemplateEmail } = require('./emailController');
            sendTemplateEmail(
                registration.User.email,
                'checkInSuccess',
                registration.User.name,
                event.name
            ).catch(err => console.error("checkInSuccess email failed:", err));

            return res.status(200).json({
                message: `SUCCESS: ${registration.User.name} Checked In`,
                success: true,
                alreadyMarked: false,
                participant: registration.User.name,
                uniqueId: registration.User.unique_id,
                event: event.name,
                sessionName: session.sessionName,
                dayNumber: session.day,
                totalDays: event.event_duration,
                scannedAt: attendance.scanned_at,
                isAdminBadge,
            });
        }

        // ─── BRANCH 3: Client Version Mismatch ───
        // sessionId missing BUT event HAS sessions defined
        if (hasSessions) {
            return res.status(400).json({
                message: 'Error: Please select a specific attendance session context before scanning.',
                success: false,
            });
        }

        // ─── BRANCH 2: Legacy Fallback ───
        // sessionId missing AND event has NO sessions
        const eventStartDate = new Date(event.date);
        const today = new Date();
        eventStartDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - eventStartDate.getTime();
        const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (dayNumber < 1 || dayNumber > event.event_duration) {
            return res.status(400).json({
                message: `This scan is outside the event dates. Event runs Day 1-${event.event_duration}. Today would be Day ${dayNumber}.`,
                success: false
            });
        }

        // Idempotency check for legacy (day_number only)
        const existing = await Attendance.findOne({
            where: {
                registration_id: registration.id,
                day_number: dayNumber,
                session_id: null,
            }
        });

        if (existing) {
            return res.status(200).json({
                message: `WARNING: ${registration.User.name} is already checked in for Day ${dayNumber}.`,
                success: true,
                alreadyMarked: true,
                participant: registration.User.name,
                uniqueId: registration.User.unique_id,
                dayNumber,
                scannedAt: existing.scanned_at,
                isAdminBadge,
            });
        }

        // Create legacy attendance record
        const attendance = await Attendance.create({
            registration_id: registration.id,
            day_number: dayNumber,
            session_id: null,
            scanned_at: new Date(),
        });

        if (!registration.attendance) {
            registration.attendance = true;
            await registration.save();
        }

        AuditLog.create({
            userId: req.user ? req.user.id : null,
            userName: req.user ? req.user.name : 'System Scanner',
            userRole: req.user ? req.user.role : 'System',
            action: 'Attendance Marked',
            target: `Registration [${registration.id}] - Day [${dayNumber}]`,
            ipAddress: req.ip || req.connection.remoteAddress
        }).catch(err => console.error('AuditLog Error:', err));

        const { sendTemplateEmail } = require('./emailController');
        sendTemplateEmail(
            registration.User.email,
            'checkInSuccess',
            registration.User.name,
            event.name
        ).catch(err => console.error("checkInSuccess email failed:", err));

        return res.status(200).json({
            message: `SUCCESS: ${registration.User.name} Checked In`,
            success: true,
            alreadyMarked: false,
            participant: registration.User.name,
            uniqueId: registration.User.unique_id,
            event: event.name,
            dayNumber,
            totalDays: event.event_duration,
            scannedAt: attendance.scanned_at,
            isAdminBadge,
        });

    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// ─── Get Session Roster ──────────────────────────────────────────────
const getSessionRoster = async (req, res) => {
    try {
        const { eventId, sessionId } = req.params;

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Get all approved registrations for this event
        const registrations = await Registration.findAll({
            where: { event_id: eventId, status: 'approved' },
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'unique_id', 'phone', 'college'] },
            ],
            order: [[User, 'name', 'ASC']],
        });

        // Get attendance records for this session
        const regIds = registrations.map(r => r.id);
        const whereClause = {
            registration_id: { [Op.in]: regIds },
        };

        // If sessionId is 'legacy', fetch records with null session_id
        if (sessionId === 'legacy') {
            whereClause.session_id = null;
        } else {
            whereClause.session_id = sessionId;
        }

        const attendanceRecords = await Attendance.findAll({ where: whereClause });
        const checkedInRegIds = new Set(attendanceRecords.map(a => a.registration_id));

        const roster = registrations.map(reg => ({
            registrationId: reg.id,
            userId: reg.User.id,
            name: reg.User.name,
            email: reg.User.email,
            uniqueId: reg.User.unique_id,
            phone: reg.User.phone,
            college: reg.User.college,
            isPresent: checkedInRegIds.has(reg.id),
            scannedAt: attendanceRecords.find(a => a.registration_id === reg.id)?.scanned_at || null,
        }));

        const totalRegistered = roster.length;
        const totalPresent = roster.filter(r => r.isPresent).length;
        const totalAbsent = totalRegistered - totalPresent;

        res.json({
            event: { id: event.id, name: event.name, duration: event.event_duration },
            sessionId,
            totalRegistered,
            totalPresent,
            totalAbsent,
            roster,
        });

    } catch (error) {
        console.error('Session roster error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Toggle Session Attendance (Manual Override) ─────────────────────
const toggleSessionAttendance = async (req, res) => {
    try {
        const { registrationId, sessionId, markPresent } = req.body;

        if (!registrationId) {
            return res.status(400).json({ message: 'registrationId is required' });
        }

        const registration = await Registration.findByPk(registrationId, {
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'unique_id'] },
                { model: Event, attributes: ['id', 'name', 'event_duration', 'attendance_sessions'] },
            ]
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const event = registration.Event;
        const sessions = event.attendance_sessions || [];

        // Determine the day_number from the session
        let dayNumber = 1;
        let effectiveSessionId = sessionId || null;

        if (sessionId) {
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                dayNumber = session.day;
            }
        }

        if (markPresent) {
            // Check if already marked
            const existing = await Attendance.findOne({
                where: {
                    registration_id: registrationId,
                    session_id: effectiveSessionId,
                }
            });

            if (existing) {
                return res.status(200).json({
                    message: `${registration.User.name} is already marked present`,
                    alreadyMarked: true,
                    success: true,
                });
            }

            await Attendance.create({
                registration_id: registrationId,
                day_number: dayNumber,
                session_id: effectiveSessionId,
                scanned_at: new Date(),
            });

            // Update legacy boolean
            if (!registration.attendance) {
                registration.attendance = true;
                await registration.save();
            }

            AuditLog.create({
                userId: req.user ? req.user.id : null,
                userName: req.user ? req.user.name : 'System Scanner',
                userRole: req.user ? req.user.role : 'System',
                action: 'Attendance Marked',
                target: `Registration [${registration.id}] - Session [${effectiveSessionId}]`,
                ipAddress: req.ip || req.connection.remoteAddress
            }).catch(err => console.error('AuditLog Error:', err));

            return res.status(200).json({
                message: `${registration.User.name} marked as Present`,
                success: true,
                isPresent: true,
            });
        } else {
            // Remove attendance record
            const deleted = await Attendance.destroy({
                where: {
                    registration_id: registrationId,
                    session_id: effectiveSessionId,
                }
            });

            // Check if user has any remaining attendance records
            const remaining = await Attendance.count({
                where: { registration_id: registrationId }
            });

            if (remaining === 0) {
                registration.attendance = false;
                await registration.save();
            }

            AuditLog.create({
                userId: req.user ? req.user.id : null,
                userName: req.user ? req.user.name : 'System Scanner',
                userRole: req.user ? req.user.role : 'System',
                action: 'Attendance Unmarked',
                target: `Registration [${registration.id}] - Session [${effectiveSessionId}]`,
                ipAddress: req.ip || req.connection.remoteAddress
            }).catch(err => console.error('AuditLog Error:', err));

            return res.status(200).json({
                message: `${registration.User.name} marked as Absent`,
                success: true,
                isPresent: false,
            });
        }

    } catch (error) {
        console.error('Toggle session attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Legacy: Scan QR code (backward compat endpoint) ─────────────────
const scanQR = async (req, res) => {
    // Delegate to markAttendance for unified logic
    return markAttendance(req, res);
};

// Get attendance report for an event
const getAttendanceReport = async (req, res) => {
    try {
        const { event_id } = req.params;

        const event = await Event.findByPk(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Get total approved registrations
        const totalApproved = await Registration.count({
            where: { event_id, status: 'approved' }
        });

        // Get all attendance records for this event's registrations
        const registrations = await Registration.findAll({
            where: { event_id, status: 'approved' },
            attributes: ['id'],
        });
        const regIds = registrations.map(r => r.id);

        const sessions = event.attendance_sessions || [];

        // If event has sessions, report per-session
        if (sessions.length > 0) {
            const sessionCounts = [];
            for (const session of sessions) {
                const count = await Attendance.count({
                    where: {
                        registration_id: { [Op.in]: regIds },
                        session_id: session.id,
                    }
                });
                sessionCounts.push({
                    sessionId: session.id,
                    sessionName: session.sessionName,
                    day: session.day,
                    present: count,
                    total: totalApproved,
                });
            }

            return res.json({
                event: { id: event.id, name: event.name, duration: event.event_duration },
                totalApproved,
                sessionCounts,
                records: [],
            });
        }

        // Legacy: per-day counts
        const dayCounts = [];
        for (let day = 1; day <= event.event_duration; day++) {
            const count = await Attendance.count({
                where: {
                    registration_id: { [Op.in]: regIds },
                    day_number: day,
                }
            });
            dayCounts.push({ day, present: count, total: totalApproved });
        }

        // Get detailed attendance records
        const attendanceRecords = await Attendance.findAll({
            where: {
                registration_id: { [Op.in]: regIds },
            },
            include: [{
                model: Registration,
                attributes: ['id', 'user_id'],
                include: [{ model: User, attributes: ['name', 'email'] }]
            }],
            order: [['day_number', 'ASC'], ['scanned_at', 'DESC']],
        });

        res.json({
            event: { id: event.id, name: event.name, duration: event.event_duration },
            totalApproved,
            dayCounts,
            records: attendanceRecords,
        });

    } catch (error) {
        console.error('Attendance report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    scanQR,
    markAttendance,
    getAttendanceReport,
    getSessionRoster,
    toggleSessionAttendance,
};
