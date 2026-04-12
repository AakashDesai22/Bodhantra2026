const path = require('path');
const { sequelize } = require('./config/db');

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const migration = require('./migrations/20260405000000-add-certificate-fields');
        await migration.up(sequelize.getQueryInterface(), require('sequelize'));

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
