const { sequelize } = require('./models');

async function checkTables() {
  try {
    const [results] = await sequelize.query("SHOW TABLES");
    console.log("Tables in database:");
    results.forEach(row => {
      console.log("- " + Object.values(row)[0]);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTables();
