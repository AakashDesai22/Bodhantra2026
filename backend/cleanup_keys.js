const { sequelize } = require('./config/db');

async function cleanupIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const [indexes] = await sequelize.query("SHOW INDEX FROM Users");
    
    // Group by column name to keep one unique index per column, drop the rest
    const indexNames = indexes.map(i => i.Key_name).filter(name => name !== 'PRIMARY');
    
    // Some indexes might be duplicates like prn_2, prn_3, email_2, etc.
    // Or prn, prn_1... 
    for (const name of indexNames) {
        if (name !== 'PRIMARY' && name !== 'prn' && name !== 'email' && name !== 'unique_id') {
            console.log(`Dropping index ${name}`);
            try {
                await sequelize.query(`ALTER TABLE Users DROP INDEX \`${name}\``);
            } catch (err) {
                console.log(`Failed to drop ${name}:`, err.message);
            }
        }
    }
    
    console.log('Done cleaning up indexes');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

cleanupIndexes();
