const { sequelize } = require('./models');

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    await sequelize.query('ALTER TABLE Events ADD COLUMN isCountdownEnabled BOOLEAN DEFAULT false;');
    console.log('Added isCountdownEnabled to Events table.');
    
    await sequelize.query('ALTER TABLE Events ADD COLUMN countdownTargetDate DATETIME DEFAULT NULL;');
    console.log('Added countdownTargetDate to Events table.');
    
    console.log('Migration successful.');
    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist. Proceeding safely.');
      process.exit(0);
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
}

runMigration();
