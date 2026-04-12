const { sequelize } = require('./config/db');

async function migrate() {
    console.log('Starting manual database migration for Payment Features...');

    try {
        await sequelize.authenticate();
        console.log('Connected to Database.');

        console.log('1. Adding payment_amount column...');
        await sequelize.query('ALTER TABLE Events ADD COLUMN payment_amount INT DEFAULT 0;');
        
        console.log('2. Adding require_online_payment column...');
        await sequelize.query('ALTER TABLE Events ADD COLUMN require_online_payment BOOLEAN DEFAULT false;');
        
        console.log('3. Adding require_offline_payment column...');
        await sequelize.query('ALTER TABLE Events ADD COLUMN require_offline_payment BOOLEAN DEFAULT false;');
        
        console.log('4. Adding offline_payment_contacts column...');
        await sequelize.query('ALTER TABLE Events ADD COLUMN offline_payment_contacts TEXT DEFAULT NULL;');

        console.log('Migration completed successfully!');

    } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && error.message.includes('Duplicate column name')) {
            console.log('Note: Some columns already exist, which is fine.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

migrate();
