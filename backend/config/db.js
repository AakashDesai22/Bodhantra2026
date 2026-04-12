const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 90000 // 90 seconds
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 90000,
    idle: 10000,
    evict: 1000
  },
  retry: {
    match: [/ETIMEDOUT/, /EHOSTUNREACH/, /ECONNREFUSED/, /ECONNRESET/, /SequelizeConnectionError/],
    max: 3 // Retry 3 times
  }
});

console.log('>>> DB CONFIG: DATABASE_URL exists?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('>>> DB CONFIG: DATABASE_URL host:', process.env.DATABASE_URL.split('@')[1]?.split(':')[0] || 'Unknown');
}


// const sequelize = new Sequelize(
//   process.env.DB_NAME || 'mavericks_events',
//   process.env.DB_USER || 'root',
//   process.env.DB_PASSWORD || '',
//   {
//     host: process.env.DB_HOST || 'localhost',
//     dialect: 'mysql',
//     logging: false, // Set to console.log to see SQL queries
//   }
// );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected...');
    
    // Sync models if connected
    await sequelize.sync();
    console.log('Database synced.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('>>> SERVER WARNING: Database is unreachable. Server is staying alive for debugging.');
    // Do NOT exit, let the server stay live.
  }
};

module.exports = { sequelize, connectDB };
