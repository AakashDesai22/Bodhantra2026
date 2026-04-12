require('dotenv').config();
const { sequelize, User, Event, Registration } = require('../models');
const crypto = require('crypto');
const fs = require('fs');

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const generateQRToken = (uniqueId, eventId) => {
    const data = `${uniqueId}:${eventId}`;
    const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret').update(data).digest('hex');
    return `${data}:${hmac}`;
};

async function main() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        const salt = crypto.randomBytes(4).toString('hex');

        // 1. Create a legacy event (no sessions defined)
        const legacyEvent = await Event.create({
            name: 'Legacy Tech Talk ' + salt,
            slug: 'legacy-tech-talk-' + salt,
            description: 'Old style event without explicit sessions',
            date: new Date('2026-04-01'),
            time: '10:00 AM',
            venue: 'Auditorium 1',
            status: 'active',
            participant_limit: 100,
            event_duration: 1,
            registration_open: true,
            custom_fields: []
        });

        // 2. Create a modern event (with sessions)
        const modernEvent = await Event.create({
            name: 'Modern Hackathon ' + salt,
            slug: 'modern-hackathon-' + salt,
            description: 'Advanced event with multiple sessions',
            date: new Date('2026-04-05'),
            time: '09:00 AM',
            venue: 'Main Lab',
            status: 'active',
            participant_limit: 150,
            event_duration: 2,
            registration_open: true,
            custom_fields: [],
            attendance_sessions: [
                { id: generateUUID(), day: 1, sessionName: "Day 1: Morning Check-in" },
                { id: generateUUID(), day: 1, sessionName: "Day 1: Evening Workshop" },
                { id: generateUUID(), day: 2, sessionName: "Day 2: Final Demos" }
            ]
        });

        // 3. Create test users
        const users = await User.bulkCreate([
            {
                name: 'Alice Tester',
                email: `alice.${salt}@example.com`,
                password: 'dummy',
                role: 'user',
                phone: '1234567890',
                college: 'Tech University',
                unique_id: `MAV-PRT-2026-${Math.floor(100 + Math.random() * 900)}`
            },
            {
                name: 'Bob Script',
                email: `bob.${salt}@example.com`,
                password: 'dummy',
                role: 'user',
                phone: '0987654321',
                college: 'State College',
                unique_id: `MAV-PRT-2026-${Math.floor(100 + Math.random() * 900)}`
            }
        ]);

        // 4. Create approved registrations with valid QR tokens
        for (const user of users) {
             // Register for legacy event
             await Registration.create({
                user_id: user.id,
                event_id: legacyEvent.id,
                status: 'approved',
                qr_token: generateQRToken(user.unique_id, legacyEvent.id),
                custom_responses: {}
             });

             // Register for modern event
             await Registration.create({
                user_id: user.id,
                event_id: modernEvent.id,
                status: 'approved',
                qr_token: generateQRToken(user.unique_id, modernEvent.id),
                custom_responses: {}
             });
        }

        console.log('Successfully generated mock data');
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('mock_error.txt', e.toString() + '\\n' + (e.sqlMessage ? e.sqlMessage : '') + '\\n' + (e.sql ? e.sql : ''));
        process.exit(1);
    }
}

main();
