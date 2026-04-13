const bcrypt = require('bcryptjs');
const { Registration, Event, User, Otp, AuditLog, FeedbackResponse } = require('../models');
const { Op } = require('sequelize');

// Public: Register for an event (auto-creates user account)
const registerForEvent = async (req, res) => {
    try {
        const { event_id } = req.params;
        const { name, email, phone, payment_method, custom_data, otp, prn, college, branch, year } = req.body;

        if (!name || !email || !phone || !otp || !prn || !college || !branch || !year) {
            return res.status(400).json({ message: 'All standard fields including academic details and OTP are required' });
        }

        if (prn.length < 8) {
            return res.status(400).json({ message: 'Invalid PRN length. Must be at least 8 characters.' });
        }


        // Verify OTP (using resilient verifyOtp helper)
        const { verifyOtp } = require('./emailController');
        const isOtpValid = await verifyOtp(email, otp);

        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
        }

        // Check if event exists
        const event = await Event.findByPk(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (event.status !== 'active') {
            return res.status(400).json({ message: 'This event is no longer accepting registrations' });
        }

        // Check if registration is open
        if (!event.registration_open) {
            return res.status(400).json({ message: 'Registrations are currently closed for this event' });
        }

        // Check participant limit
        if (event.participant_limit) {
            const currentCount = await Registration.count({
                where: { event_id, status: { [Op.ne]: 'rejected' } }
            });
            if (currentCount >= event.participant_limit) {
                return res.status(400).json({ message: 'This event is sold out. No more registrations available.' });
            }
        }

        // Check if user already exists by Email or PRN
        let user = await User.findOne({ 
            where: { 
                [Op.or]: [{ email }, { prn }] 
            } 
        });

        // 1. If user exists by PRN but with a DIFFERENT email
        if (user && user.email !== email && user.prn === prn) {
            return res.status(400).json({ message: 'This PRN is already registered with a different email. Please login with your original account.' });
        }

        let isNewUser = false;
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(phone, salt);

            user = await User.create({
                name,
                email,
                password: hashedPassword,
                phone,
                prn,
                college,
                branch,
                year,
                role: 'user',
            });
            isNewUser = true;
        }

        // Check if already registered for this specific event
        const existingRegistration = await Registration.findOne({
            where: { user_id: user.id, event_id },
        });

        if (existingRegistration) {
            return res.status(400).json({ message: 'You have already registered for this event!' });
        }

        // Handle payment screenshot
        let payment_ss_url = req.body.payment_ss_url || null;
        if (payment_method === 'online' && !payment_ss_url && req.file) {
            payment_ss_url = req.file.path;
        }

        // Parse custom_data
        let parsedCustomData = null;
        if (custom_data) {
            try {
                parsedCustomData = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            } catch (e) {
                parsedCustomData = null;
            }
        }

        const registration = await Registration.create({
            user_id: user.id,
            event_id: parseInt(event_id),
            payment_ss_url,
            payment_method: payment_method || 'offline',
            custom_data: parsedCustomData ? JSON.stringify(parsedCustomData) : null,
            status: 'pending',
            attendance: false,
        });

        // Trigger registrationReceived email
        const { sendRegistrationEmail } = require('./emailController');
        
        let offlineManagersHtml = '';
        if (event.offline_payment_contacts && event.offline_payment_contacts.length > 0) {
            offlineManagersHtml = '<div style="background: rgba(14, 165, 233, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid #0ea5e9;">' + event.offline_payment_contacts.map(c => `<p style="margin: 4px 0; font-size: 14px;"><strong>${c.name}</strong> • <a href="tel:${c.phone}" style="color: #38bdf8; text-decoration: none;">${c.phone}</a></p>`).join('') + '</div>';
        }

        sendRegistrationEmail(
            email,
            name,
            event.name,
            '',
            event.whatsapp_link,
            payment_method || 'offline',
            offlineManagersHtml
        ).catch(err => console.error("registrationReceived email failed:", err));

        // Explicitly log the registration action
        AuditLog.create({
            userId: user.id, // Using the newly created or fetched user.id
            userName: name || 'Guest',
            userRole: 'Guest',
            action: 'Participant Registered',
            target: 'Event Registration',
            ipAddress: req.ip || req.connection.remoteAddress
        }).catch(err => console.error('AuditLog Error:', err));

        res.status(201).json({
            message: 'Registration successful!',
            registration,
            credentials: {
                loginId: email,
                password: phone,
                isNewUser,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Protected: Create a registration (for logged-in users)
const createRegistration = async (req, res) => {
    try {
        const { event_id, payment_method, payment_ss_url: bodyUrl } = req.body;
        let payment_ss_url = bodyUrl || null;

        if (payment_method === 'online' && !payment_ss_url) {
            if (!req.file) {
                return res.status(400).json({ message: 'Payment screenshot is required for online payment' });
            }
            payment_ss_url = req.file.path;
        }

        const event = await Event.findByPk(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if registration is open
        if (!event.registration_open) {
            return res.status(400).json({ message: 'Registrations are currently closed for this event' });
        }

        // Check participant limit
        if (event.participant_limit) {
            const currentCount = await Registration.count({
                where: { event_id, status: { [Op.ne]: 'rejected' } }
            });
            if (currentCount >= event.participant_limit) {
                return res.status(400).json({ message: 'This event is sold out. No more registrations available.' });
            }
        }

        const existingRegistration = await Registration.findOne({
            where: { user_id: req.user.id, event_id },
        });

        if (existingRegistration) {
            return res.status(400).json({ message: 'You have already registered for this event' });
        }

        const registration = await Registration.create({
            user_id: req.user.id,
            event_id,
            payment_ss_url,
            payment_method,
            status: 'pending',
            attendance: false,
        });

        // Trigger registrationReceived email
        const { sendRegistrationEmail } = require('./emailController');
        
        let offlineManagersHtml = '';
        if (event.offline_payment_contacts && event.offline_payment_contacts.length > 0) {
            offlineManagersHtml = '<div style="background: rgba(14, 165, 233, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid #0ea5e9;">' + event.offline_payment_contacts.map(c => `<p style="margin: 4px 0; font-size: 14px;"><strong>${c.name}</strong> • <a href="tel:${c.phone}" style="color: #38bdf8; text-decoration: none;">${c.phone}</a></p>`).join('') + '</div>';
        }

        sendRegistrationEmail(
            req.user.email,
            req.user.name,
            event.name,
            '',
            event.whatsapp_link,
            payment_method || 'offline',
            offlineManagersHtml
        ).catch(err => console.error("registrationReceived email failed:", err));

        res.status(201).json(registration);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get my registrations
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            where: { user_id: req.user.id },
            include: [
                { model: Event, attributes: ['id', 'name', 'slug', 'date', 'time', 'venue', 'status', 'event_duration', 'whatsapp_link', 'isFeedbackEnabled', 'feedbackTitle', 'feedbackQuestions', 'feedbackSessions', 'certificateTemplates'] },
                { model: User, attributes: ['id', 'name', 'email', 'unique_id', 'role'] }
            ],
            order: [['createdAt', 'DESC']],
        });

        // Check feedback status for each registration
        const registrationsWithFeedback = await Promise.all(registrations.map(async (reg) => {
            const jsonReg = reg.toJSON();
            if (jsonReg.status === 'approved' && jsonReg.Event && jsonReg.Event.isFeedbackEnabled) {
                const submittedFeedbacks = await FeedbackResponse.findAll({
                    where: { eventId: reg.event_id, userId: req.user.id }
                });
                
                const requiredSessionsCount = jsonReg.Event.feedbackSessions ? jsonReg.Event.feedbackSessions.length : 1;
                jsonReg.hasFeedback = submittedFeedbacks.length >= requiredSessionsCount;
                jsonReg.submittedSessions = submittedFeedbacks.map(f => f.sessionName);
            } else {
                jsonReg.hasFeedback = false;
                jsonReg.submittedSessions = [];
            }
            return jsonReg;
        }));

        res.json(registrationsWithFeedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerForEvent,
    createRegistration,
    getMyRegistrations,
};
