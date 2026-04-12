const { sequelize } = require('./models');
const migration = require('./migrations/20260402000001-add-feedback-title');

const run = async () => {
    try {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        console.log('Migration up successful');
    } catch (e) {
        console.error('Migration failed:', e);
    }
    process.exit();
}
run();
