const { Op } = require('sequelize');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { sequelize, User, Registration, Event, Query, Attendance, AuditLog, Otp, Assignment, AllocationRule, SeatingGrid, FeedbackResponse } = require('../models');
const { sendTemplateEmail } = require('./emailController');

// Generate role-based unique ID
// Format: MAV-[ADM/MEM/PRT]-[YEAR]-[XXX]
const generateUniqueID = async (role) => {
    const year = new Date().getFullYear();
    let prefix = 'PRT';
    if (role === 'admin') prefix = 'ADM';
    if (role === 'member') prefix = 'MEM';
    const tag = `MAV-${prefix}-${year}`;

    // Find the last ID for this prefix and year
    const lastUser = await User.findOne({
        where: {
            unique_id: { [Op.like]: `${tag}-%` }
        },
        order: [['unique_id', 'DESC']]
    });

    let nextNumber = 1;
    if (lastUser && lastUser.unique_id) {
        const parts = lastUser.unique_id.split('-');
        const lastNumber = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `${tag}-${nextNumber.toString().padStart(3, '0')}`;
};

// Generate HMAC-signed QR token
const generateQRToken = (uniqueId, eventId) => {
    const data = `${uniqueId}:${eventId}`;
    const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('hex');
    return `${data}:${hmac}`;
};

// Analytics: Advanced Enterprise Data
const getAnalytics = async (req, res) => {
    try {
        const totalRegistrations = await Registration.count();
        const pendingRegistrations = await Registration.count({ where: { status: 'pending' } });
        const approvedRegistrations = await Registration.count({ where: { status: 'approved' } });
        const activeEvents = await Event.count({ where: { status: 'active' } });
        const totalParticipants = await User.count({ where: { role: 'user' } });

        // Registration Trends (per day)
        const trends = await sequelize.query(`
            SELECT DATE(createdAt) as date, COUNT(*) as count 
            FROM Registrations 
            GROUP BY DATE(createdAt) 
            ORDER BY date ASC 
            LIMIT 30
        `, { type: sequelize.QueryTypes.SELECT });

        // Event Popularity
        const eventPopularity = await sequelize.query(`
            SELECT e.name, COUNT(r.id) as count 
            FROM Events e 
            LEFT JOIN Registrations r ON e.id = r.event_id 
            GROUP BY e.id, e.name
        `, { type: sequelize.QueryTypes.SELECT });

        // Department/College Stats
        const demographics = await sequelize.query(`
            SELECT IFNULL(college, 'Unknown') as name, COUNT(*) as value 
            FROM Users 
            WHERE role = 'user' 
            GROUP BY college
        `, { type: sequelize.QueryTypes.SELECT });

        res.json({
            totals: {
                totalRegistrations,
                pendingRegistrations,
                approvedRegistrations,
                activeEvents,
                totalParticipants,
            },
            trends,
            eventPopularity,
            demographics,
            pendingCount: pendingRegistrations,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get System Logs for Audit Module
const getSystemLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const where = {};
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            where[Op.or] = [
                { userName: { [Op.like]: searchTerm } },
                { action: { [Op.like]: searchTerm } },
            ];
        }
        
        // Date range Filter
        if (req.query.startDate && req.query.endDate) {
            let end = new Date(req.query.endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt = {
                [Op.between]: [new Date(req.query.startDate), end]
            };
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });
        
        res.json({
            data: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalLogs: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all registrations (with custom_data)
const getAllRegistrations = async (req, res) => {
    try {
        const where = {};
        if (req.query.event_id) {
            where.event_id = req.query.event_id;
        }

        const userWhere = {};
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            userWhere[Op.or] = [
                { name: { [Op.like]: searchTerm } },
                { email: { [Op.like]: searchTerm } },
                { prn: { [Op.like]: searchTerm } },
                { unique_id: { [Op.like]: searchTerm } },
            ];
        }

        const registrations = await Registration.findAll({
            where,
            include: [
                { 
                    model: User, 
                    attributes: ['id', 'name', 'prn', 'email', 'phone', 'college', 'year', 'unique_id', 'role'],
                    where: Object.keys(userWhere).length > 0 ? userWhere : undefined
                },
                { model: Event, attributes: ['name', 'slug'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single registration details (with User, Event, and Attendance)
const getRegistrationDetails = async (req, res) => {
    try {
        const registration = await Registration.findByPk(req.params.id, {
            include: [
                { 
                    model: User, 
                    attributes: ['id', 'name', 'prn', 'email', 'phone', 'college', 'year', 'unique_id', 'role'] 
                },
                { model: Event },
                { model: Attendance },
            ],
            order: [[Attendance, 'day_number', 'ASC']],
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        res.json(registration);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update registration status (with QR generation on approval)
const updateRegistrationStatus = async (req, res) => {
    try {
        const { status, templateId, customBody } = req.body;
        const registration = await Registration.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'role', 'unique_id'] },
                { model: Event, attributes: ['id', 'name', 'whatsapp_link', 'offline_payment_contacts'] }
            ]
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.status = status;

        // Generate QR code on approval
        let qrCodeDataUrl = null;
        if (status === 'approved' && !registration.qr_code_data) {
            // Generate Unique ID if user doesn't have one
        if (!registration.User.unique_id) {
            registration.User.unique_id = await generateUniqueID(registration.User.role);
            await registration.User.save();
        }

        const qrToken = generateQRToken(registration.User.unique_id, registration.event_id);
            qrCodeDataUrl = await QRCode.toDataURL(qrToken, {
                width: 300,
                margin: 2,
                color: { dark: '#1e293b', light: '#ffffff' }
            });
            registration.qr_code_data = qrCodeDataUrl;
        }

        await registration.save();
        
        // If templateId provided, send email (with QR if just approved)
        if (templateId && registration.User && registration.Event) {
            const { sendTemplateEmail } = require('./emailController');
            
            let extraArgs = [];
            if (status === 'approved') {
                extraArgs = [registration.Event.whatsapp_link];
            } else if (status === 'rejected') {
                let offlineManagersHtml = '';
                if (registration.Event.offline_payment_contacts && registration.Event.offline_payment_contacts.length > 0) {
                    offlineManagersHtml = '<div style="background: rgba(14, 165, 233, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid #0ea5e9;">' + registration.Event.offline_payment_contacts.map(c => `<p style="margin: 4px 0; font-size: 14px;"><strong>${c.name}</strong> • <a href="tel:${c.phone}" style="color: #38bdf8; text-decoration: none;">${c.phone}</a></p>`).join('') + '</div>';
                }
                extraArgs = [offlineManagersHtml];
            }

            await sendTemplateEmail(
                registration.User.email, 
                templateId, 
                registration.User.name, 
                registration.Event.name, 
                customBody,
                registration.qr_code_data,
                ...extraArgs
            );
        }

        res.json(registration);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle attendance
const toggleAttendance = async (req, res) => {
    try {
        const { templateId, customBody } = req.body;
        const registration = await Registration.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: Event, attributes: ['name'] }
            ]
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.attendance = !registration.attendance;
        await registration.save();

        // Send email if attendance is marked (not unchecked) and templateId provided
        if (registration.attendance && templateId && registration.User && registration.Event) {
            const { sendTemplateEmail } = require('./emailController');
            await sendTemplateEmail(
                registration.User.email, 
                templateId, 
                registration.User.name, 
                registration.Event.name, 
                customBody
            );
        }

        res.json(registration);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update participant details
const updateParticipant = async (req, res) => {
    try {
        const { name, phone, prn, college, year } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (prn) user.prn = prn;
        if (college) user.college = college;
        if (year) user.year = year;

        await user.save();
        res.json({ message: 'Participant updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all queries
const getAllQueries = async (req, res) => {
    try {
        const queries = await Query.findAll({
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']],
        });
        res.json(queries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Respond to query
const respondToQuery = async (req, res) => {
    try {
        const { response } = req.body;
        const query = await Query.findByPk(req.params.id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        query.response = response;
        query.status = 'resolved';
        await query.save();

        res.json(query);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Resend QR Code Email
const resendQRCode = async (req, res) => {
    try {
        const registration = await Registration.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: Event, attributes: ['id', 'name'] }
            ]
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (!registration.qr_code_data) {
            return res.status(400).json({ message: 'QR code not generated yet. Approve the registration first.' });
        }

        const { sendTemplateEmail } = require('./emailController');
        const sent = await sendTemplateEmail(
            registration.User.email, 
            'resendQR', 
            registration.User.name, 
            registration.Event.name, 
            registration.User.unique_id,
            registration.qr_code_data
        );

        if (sent) {
            res.json({ message: 'QR Code resent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send QR Code email' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Manual Add Participant
const manualAddParticipant = async (req, res) => {
    try {
        const { name, email, phone, prn, college, year, event_id } = req.body;

        // Basic validation (PRN length, Phone number might be checked here)
        if (prn && prn.length < 5) return res.status(400).json({ message: 'PRN too short' });
        if (phone && phone.length < 10) return res.status(400).json({ message: 'Invalid phone number' });

        // Check if user exists or create
        let user = await User.findOne({ where: { email } });
        if (!user) {
            const password = crypto.randomBytes(8).toString('hex'); // Generate random password
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await User.create({
                name, email, phone, prn, college, year,
                password: hashedPassword,
                role: 'user',
                unique_id: await generateUniqueID('user')
            });
        }

        // Check if already registered for this event
        const existing = await Registration.findOne({ where: { user_id: user.id, event_id } });
        if (existing) return res.status(400).json({ message: 'Already registered for this event' });

        // Create approved registration
        const qrToken = generateQRToken(user.unique_id, event_id);
        const qrCodeDataUrl = await qrcode.toDataURL(qrToken);

        const registration = await Registration.create({
            user_id: user.id,
            event_id,
            status: 'approved',
            qr_code_data: qrCodeDataUrl
        });

        // Send confirmation email
        const { sendTemplateEmail } = require('./emailController');
        const event = await Event.findByPk(event_id);
        await sendTemplateEmail(user.email, 'paymentApproved', user.name, event.name, '', qrCodeDataUrl, event.whatsapp_link);

        res.json({ message: 'Participant added manually and approved', registration });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Participant (Cascade manually since soft deletes aren't used)
const deleteParticipant = async (req, res) => {
    const { confirm } = req.body;
    if (confirm !== 'DELETE') {
        return res.status(400).json({ message: 'Please type DELETE to confirm' });
    }

    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get all registrations to delete attendance
        const registrations = await Registration.findAll({ where: { user_id: user.id } });
        const regIds = registrations.map(r => r.id);

        await Attendance.destroy({ where: { registration_id: regIds } });
        await Registration.destroy({ where: { user_id: user.id } });
        await Query.destroy({ where: { user_id: user.id } });
        await user.destroy();

        res.json({ message: 'User and all related records deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DANGER: Reset Platform (Wipe test data)
const resetPlatform = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Delete in FK-safe order: children first, then parents
        await Attendance.destroy({ where: {}, transaction });
        await Assignment.destroy({ where: {}, transaction });
        await AllocationRule.destroy({ where: {}, transaction });
        await SeatingGrid.destroy({ where: {}, transaction });
        await Otp.destroy({ where: {}, transaction });
        await Registration.destroy({ where: {}, transaction });
        await Query.destroy({ where: {}, transaction });
        await AuditLog.destroy({ where: {}, transaction });
        
        // Delete all users except admins
        await User.destroy({ 
            where: { role: { [Op.ne]: 'admin' } }, 
            transaction 
        });
        
        await Event.destroy({ where: {}, transaction });

        // Reset Auto-Increment Counters (MySQL specific)
        const tables = [
            Attendance.tableName,
            Assignment.tableName,
            AllocationRule.tableName,
            SeatingGrid.tableName,
            Otp.tableName,
            Registration.tableName,
            Query.tableName,
            AuditLog.tableName,
            User.tableName,
            Event.tableName,
        ];

        for (const table of tables) {
            try {
                await sequelize.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`, { transaction });
            } catch (e) {
                // Some tables may not have auto-increment, skip silently
            }
        }

        await transaction.commit();
        res.json({ message: 'Platform reset successfully. All test data cleared and counters reset.' });
    } catch (error) {
        await transaction.rollback();
        console.error('Reset Platform Error:', error);
        res.status(500).json({ message: 'Failed to reset platform' });
    }
};

// Upload generic photo for admin dashboard tools (e.g. Winner Display)
const uploadAdminPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Return the path or filename so frontend can display it
        res.json({ 
            message: 'Photo uploaded successfully', 
            url: req.file.path 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during upload' });
    }
};

// Update Feedback Configuration
const updateFeedbackConfig = async (req, res) => {
    try {
        const { isFeedbackEnabled, feedbackQuestions, feedbackTitle, feedbackSessions } = req.body;
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        event.isFeedbackEnabled = isFeedbackEnabled;
        if (feedbackTitle !== undefined) event.feedbackTitle = feedbackTitle;
        if (feedbackSessions !== undefined) event.feedbackSessions = feedbackSessions;
        event.feedbackQuestions = feedbackQuestions;
        await event.save();

        res.json({ message: 'Feedback configuration updated successfully', event });
    } catch (error) {
        console.error('Update Feedback Config Error:', error);
        res.status(500).json({ message: 'Server error updating feedback config' });
    }
};

// Send Feedback Email Blast
const sendFeedbackEmailBlast = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Fetch all approved registrations for this event
        const registrations = await Registration.findAll({
            where: { event_id: event.id, status: 'approved' },
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        if (!registrations || registrations.length === 0) {
            return res.status(400).json({ message: 'No approved participants found for this event' });
        }

        // Return immediately so admin doesn't wait
        res.status(200).json({ message: `Started sending feedback emails to ${registrations.length} participants` });

        // Process in background with delay to avoid rate limits
        for (const reg of registrations) {
            try {
                if (reg.User && reg.User.email) {
                    const subject = `Action Required: Share your Bodhantra experience for ${event.name} 🚀`;
                    
                    // The sendTemplateEmail signature is: sendTemplateEmail(email, templateId, name, eventName, customBody, qrCodeDataUrl, ...extraArgs)
                    // We can pass the subject via customBody or however it's handled. 
                    // Actually, sendTemplateEmail internally gets subject from template title unless we override it.
                    // Let's modify sendTemplateEmail to allow passing subject? Wait, the template `eventFeedback` doesn't take subject as parameter, but `sendTemplateEmail` uses the html match for `<title>`.
                    // But in emailController, `sendTemplateEmail` extracts subject from HTML title or fallback. We can't pass subject directly to `sendTemplateEmail` without modifying it.
                    // Wait, emailController.js we saw earlier didn't have subject argument for sendTemplateEmail. Let's look again. Let's write the loop first and then I'll use the nodemailer transporter directly if needed, or edit `emailController.js` to accept `subject` as an overarching parameter. Wait, we can pass it via `extraArgs` if the template uses it? No, templates don't take it.
                    
                    // I will just use `sendTemplateEmail` and then we'll see if I need to update it.
                    
                    // Actually, let's just use emailController's transporter directly or modify emailController.
                    
                    const templates = require('../utils/emailTemplates');
                    const htmlContent = templates.eventFeedback(reg.User.name, event.name);
                    
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: reg.User.email,
                        subject: subject,
                        html: htmlContent
                    };
                    
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        }
                    });

                    if (process.env.EMAIL_USER) {
                        await transporter.sendMail(mailOptions);
                    } else {
                        console.log(`[DEV] Feedback Email Blast to ${reg.User.email} | Subject: ${subject}`);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.error(`Failed to send feedback email to ${reg.User?.email}:`, err);
            }
        }
    } catch (error) {
        console.error('Send Feedback Email Blast Error:', error);
    }
};

// Fetch Feedback for an Event
const getEventFeedback = async (req, res) => {
    try {
        const feedback = await FeedbackResponse.findAll({
            where: { eventId: req.params.id },
            include: [{ model: User, attributes: ['id', 'name', 'unique_id', 'email'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(feedback);
    } catch (error) {
        console.error('Fetch Event Feedback Error:', error);
        res.status(500).json({ message: 'Server error fetching feedback' });
    }
};

// Toggle Feedback Visibility
const toggleFeedbackVisibility = async (req, res) => {
    try {
        const feedback = await FeedbackResponse.findByPk(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.isHidden = !feedback.isHidden;
        await feedback.save();

        // Custom audit logging
        req.auditAction = feedback.isHidden ? 'Hid Feedback' : 'Restored Feedback';
        req.auditTarget = `Feedback ID: ${feedback.id}`;

        res.json({ message: `Feedback ${feedback.isHidden ? 'hidden' : 'restored'} successfully`, feedback });
    } catch (error) {
        console.error('Toggle Feedback Visibility Error:', error);
        res.status(500).json({ message: 'Server error toggling visibility' });
    }
};

// Delete single feedback permanently
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await FeedbackResponse.findByPk(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        await feedback.destroy();

        // Custom audit logging
        req.auditAction = 'Deleted Feedback';
        req.auditTarget = `Feedback ID: ${req.params.id}`;

        res.json({ message: 'Feedback deleted permanently' });
    } catch (error) {
        console.error('Delete Feedback Error:', error);
        res.status(500).json({ message: 'Server error deleting feedback' });
    }
};

// Reset Event Feedback
const resetEventFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { sessionName } = req.query;

        const whereClause = { eventId };
        if (sessionName && sessionName !== 'All') {
            whereClause.sessionName = sessionName;
        }

        const count = await FeedbackResponse.destroy({ where: whereClause });

        // Custom audit logging
        req.auditAction = 'Reset Feedback Data';
        req.auditTarget = `Event ID: ${eventId}${sessionName ? ` | Session: ${sessionName}` : ''}`;

        res.json({ message: `Successfully deleted ${count} feedback responses.` });
    } catch (error) {
        console.error('Reset Event Feedback Error:', error);
        res.status(500).json({ message: 'Server error resetting feedback' });
    }
};

module.exports = {

    generateUniqueID,
    getAnalytics,
    getAllRegistrations,
    getRegistrationDetails,
    updateRegistrationStatus,
    toggleAttendance,
    getAllQueries,
    respondToQuery,
    resendQRCode,
    getRegistrationStats: (req, res) => res.json({}), // Placeholder if needed
    updateParticipant,
    manualAddParticipant,
    deleteParticipant,
    resetPlatform,
    uploadAdminPhoto,
    getSystemLogs,
    updateFeedbackConfig,
    sendFeedbackEmailBlast,
    getEventFeedback,
    toggleFeedbackVisibility,
    deleteFeedback,
    resetEventFeedback,
};
