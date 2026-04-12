const { sequelize } = require('./models');

const syncDb = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synchronization completed successfully.');
    } catch (err) {
        console.error('Failed to sync DB:', err);
    } finally {
        process.exit();
    }
};

syncDb();
