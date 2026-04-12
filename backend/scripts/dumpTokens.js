require('dotenv').config();
const { Registration, User, Event } = require('../models');
const fs = require('fs');

async function main() {
    try {
        const alice = await User.findOne({ where: { name: 'Alice Tester' } });
        if (!alice) {
            console.log('Alice not found!');
            return process.exit(1);
        }
        
        const regs = await Registration.findAll({ 
            where: { user_id: alice.id },
            include: [Event]
        });

        const data = [];
        for (const r of regs) {
            data.push({
                eventName: r.Event.name,
                token: r.qr_token,
                sessions: r.Event.attendance_sessions
            });
        }

        fs.writeFileSync('tokens.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('Saved tokens.json');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
