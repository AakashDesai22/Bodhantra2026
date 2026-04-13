const { Event, Registration } = require('../models');
const { Op } = require('sequelize');

// Generate slug from name
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
};

// Get all active events (public) — sanitize capacity metrics
const getEvents = async (req, res) => {
    try {
        const events = await Event.findAll({ where: { status: 'active' }, order: [['date', 'ASC']] });

        const publicEvents = await Promise.all(events.map(async (eventModel) => {
            const event = eventModel.toJSON();
            const registration_count = await Registration.count({
                where: { event_id: event.id, status: { [Op.ne]: 'rejected' } }
            });
            
            const is_sold_out = event.participant_limit ? (registration_count >= event.participant_limit) : false;
            
            delete event.participant_limit;
            
            return { ...event, is_sold_out };
        }));

        res.json(publicEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all events (admin)
const getAllEventsAdmin = async (req, res) => {
    try {
        const events = await Event.findAll({ order: [['createdAt', 'DESC']] });

        const eventsWithCount = await Promise.all(events.map(async (event) => {
            const registration_count = await Registration.count({
                where: { event_id: event.id, status: { [Op.ne]: 'rejected' } }
            });
            return { ...event.toJSON(), registration_count };
        }));

        res.json(eventsWithCount);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single event by slug (public) — sanitize capacity metrics
const getEventBySlug = async (req, res) => {
    try {
        const eventModel = await Event.findOne({ where: { slug: req.params.slug } });
        if (eventModel) {
            const event = eventModel.toJSON();
            const registration_count = await Registration.count({
                where: { event_id: event.id, status: { [Op.ne]: 'rejected' } }
            });
            
            event.is_sold_out = event.participant_limit ? (registration_count >= event.participant_limit) : false;
            delete event.participant_limit;
            
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Create an event
const createEvent = async (req, res) => {
    try {
        const { name, description, date, time, venue, payment_details, offline_payment, custom_fields, attendance_sessions, participant_limit, event_duration, registration_open, whatsapp_link, payment_amount, require_online_payment, require_offline_payment, offline_payment_contacts, isCountdownEnabled, countdownTargetDate } = req.body;

        const slug = generateSlug(name);

        // Handle file uploads
        let photo_url = null;
        let poster_url = null;
        let qr_code_url = null;

        if (req.files) {
            if (req.files.photo && req.files.photo[0]) {
                photo_url = req.files.photo[0].path;
            }
            if (req.files.poster && req.files.poster[0]) {
                poster_url = req.files.poster[0].path;
            }
            if (req.files.qr_code && req.files.qr_code[0]) {
                qr_code_url = req.files.qr_code[0].path;
            }
        }

        // Parse custom_fields if it's a string
        let parsedFields = [];
        if (custom_fields) {
            try {
                parsedFields = typeof custom_fields === 'string' ? JSON.parse(custom_fields) : custom_fields;
            } catch (e) {
                parsedFields = [];
            }
        }

        // Parse attendance_sessions if it's a string
        let parsedSessions = [];
        if (attendance_sessions) {
            try {
                parsedSessions = typeof attendance_sessions === 'string' ? JSON.parse(attendance_sessions) : attendance_sessions;
            } catch (e) {
                parsedSessions = [];
            }
        }

        // Parse offline_payment_contacts if it's a string
        let parsedContacts = [];
        if (offline_payment_contacts) {
            try {
                parsedContacts = typeof offline_payment_contacts === 'string' ? JSON.parse(offline_payment_contacts) : offline_payment_contacts;
            } catch (e) {
                parsedContacts = [];
            }
        }

        const event = await Event.create({
            name,
            slug,
            description,
            date,
            time,
            venue,
            photo_url,
            poster_url,
            qr_code_url,
            offline_payment: offline_payment === 'true' || offline_payment === true,
            payment_amount: payment_amount ? parseInt(payment_amount) : 0,
            require_online_payment: require_online_payment === 'true' || require_online_payment === true,
            require_offline_payment: require_offline_payment === 'true' || require_offline_payment === true,
            offline_payment_contacts: parsedContacts,
            custom_fields: parsedFields,
            attendance_sessions: parsedSessions,
            payment_details,
            participant_limit: participant_limit ? parseInt(participant_limit) : null,
            event_duration: event_duration ? parseInt(event_duration) : 1,
            registration_open: registration_open === 'false' || registration_open === false ? false : true,
            whatsapp_link: whatsapp_link || null,
            isCountdownEnabled: isCountdownEnabled === 'true' || isCountdownEnabled === true,
            countdownTargetDate: countdownTargetDate || null,
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Update an event
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const { name, description, date, time, venue, payment_details, offline_payment, custom_fields, attendance_sessions, status, participant_limit, event_duration, registration_open, whatsapp_link, payment_amount, require_online_payment, require_offline_payment, offline_payment_contacts, isCountdownEnabled, countdownTargetDate } = req.body;

        // Handle file uploads - only update if new file provided
        if (req.files) {
            if (req.files.photo && req.files.photo[0]) {
                event.photo_url = req.files.photo[0].path;
            }
            if (req.files.poster && req.files.poster[0]) {
                event.poster_url = req.files.poster[0].path;
            }
            if (req.files.qr_code && req.files.qr_code[0]) {
                event.qr_code_url = req.files.qr_code[0].path;
            }
        }

        if (name !== undefined) {
            event.name = name;
            event.slug = generateSlug(name);
        }
        if (description !== undefined) event.description = description;
        if (date !== undefined) event.date = date;
        if (time !== undefined) event.time = time;
        if (venue !== undefined) event.venue = venue;
        if (payment_details !== undefined) event.payment_details = payment_details;
        if (status !== undefined) event.status = status;
        if (whatsapp_link !== undefined) event.whatsapp_link = whatsapp_link;
        if (offline_payment !== undefined) {
            event.offline_payment = offline_payment === 'true' || offline_payment === true;
        }
        if (payment_amount !== undefined) event.payment_amount = parseInt(payment_amount) || 0;
        if (require_online_payment !== undefined) {
            event.require_online_payment = require_online_payment === 'true' || require_online_payment === true;
        }
        if (require_offline_payment !== undefined) {
            event.require_offline_payment = require_offline_payment === 'true' || require_offline_payment === true;
        }
        if (offline_payment_contacts !== undefined) {
            try {
                event.offline_payment_contacts = typeof offline_payment_contacts === 'string' ? JSON.parse(offline_payment_contacts) : offline_payment_contacts;
            } catch (e) {
                // keep existing
            }
        }
        if (custom_fields !== undefined) {
            try {
                event.custom_fields = typeof custom_fields === 'string' ? JSON.parse(custom_fields) : custom_fields;
            } catch (e) {
                // keep existing
            }
        }
        if (participant_limit !== undefined) {
            event.participant_limit = participant_limit === '' || participant_limit === null ? null : parseInt(participant_limit);
        }
        if (event_duration !== undefined) {
            event.event_duration = parseInt(event_duration) || 1;
        }
        if (registration_open !== undefined) {
            event.registration_open = registration_open === 'false' || registration_open === false ? false : true;
        }
        if (attendance_sessions !== undefined) {
            try {
                event.attendance_sessions = typeof attendance_sessions === 'string' ? JSON.parse(attendance_sessions) : attendance_sessions;
            } catch (e) {
                // keep existing
            }
        }
        if (isCountdownEnabled !== undefined) {
            event.isCountdownEnabled = isCountdownEnabled === 'true' || isCountdownEnabled === true;
        }
        if (countdownTargetDate !== undefined) {
            event.countdownTargetDate = countdownTargetDate || null;
        }

        await event.save();
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Delete an event
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        await event.destroy();
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getEvents,
    getAllEventsAdmin,
    getEventBySlug,
    createEvent,
    updateEvent,
    deleteEvent,
};
