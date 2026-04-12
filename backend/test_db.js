const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

async function check() {
    try {
        const [users] = await sequelize.query("SELECT COUNT(*) as count FROM users");
        const [events] = await sequelize.query("SELECT COUNT(*) as count FROM events");
        const [registrations] = await sequelize.query("SELECT COUNT(*) as count FROM registrations");
        
        console.log("DB_STATUS_START");
        console.log(`Users: ${users[0].count}`);
        console.log(`Events: ${events[0].count}`);
        console.log(`Registrations: ${registrations[0].count}`);
        console.log("DB_STATUS_END");
        
        if (events[0].count > 0) {
            const [rows] = await sequelize.query("SELECT id, name FROM events");
            console.log("Events found:", rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

check();
