const { sequelize, AuditLog } = require('./models');

const syncAuditLog = async () => {
    try {
        await sequelize.authenticate();
        await AuditLog.sync({ force: true });
        console.log('AuditLog table created successfully');
    } catch (err) {
        console.error('Failed to sync AuditLog:', err);
    } finally {
        process.exit();
    }
};

syncAuditLog();
