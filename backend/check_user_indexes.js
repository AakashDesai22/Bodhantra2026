const { sequelize } = require('./models');

async function checkIndexes() {
  try {
    const [results] = await sequelize.query("SHOW INDEX FROM Users");
    console.log("Current indexes on Users table:");
    results.forEach(row => {
      console.log(`- ${row.Key_name} (Column: ${row.Column_name})`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkIndexes();
