const { Event, Registration } = require('./models');
const { sequelize } = require('./models');

async function checkData() {
    try {
        const events = await Event.findAll();
        console.log('--- Event Poster URLs ---');
        events.forEach(e => {
            console.log(`Event: ${e.name}, Poster: ${e.poster_url}, Photo: ${e.photo_url}`);
        });

        const latestReg = await Registration.findOne({ order: [['createdAt', 'DESC']] });
        if (latestReg) {
            console.log('--- Latest Registration ---');
            console.log(`ID: ${latestReg.id}, Status: ${latestReg.status}`);
        } else {
            console.log('No registrations found.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
