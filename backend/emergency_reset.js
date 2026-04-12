const { sequelize, User, Event, Registration, Query, Otp, Attendance } = require('./models');
const { Op } = require('sequelize');

async function emergencyReset() {
  const transaction = await sequelize.transaction();
  try {
    console.log("--- STARTING EMERGENCY RESET (V2) ---");

    // Table names from DB check:
    // attendances, events, otp_verifications, queries, registrations, users

    // 1. Drop redundant indexes on users table
    console.log("Cleaning up indexes on users...");
    const [indexes] = await sequelize.query("SHOW INDEX FROM users");
    for (const idx of indexes) {
      if (idx.Key_name !== 'PRIMARY' && 
          idx.Key_name !== 'email' && 
          idx.Key_name !== 'prn' && 
          idx.Key_name !== 'unique_id' &&
          idx.Key_name !== 'email_UNIQUE' &&
          idx.Key_name !== 'prn_UNIQUE' &&
          idx.Key_name !== 'unique_id_UNIQUE') {
        try {
          console.log(`Dropping index: ${idx.Key_name}`);
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${idx.Key_name}\``, { transaction });
        } catch (e) {
          console.log(`Could not drop ${idx.Key_name}: ${e.message}`);
        }
      }
    }

    // 2. Wipe data
    console.log("Wiping attendances...");
    await Attendance.destroy({ where: {}, transaction });
    console.log("Wiping otp_verifications...");
    await Otp.destroy({ where: {}, transaction });
    console.log("Wiping registrations...");
    await Registration.destroy({ where: {}, transaction });
    console.log("Wiping queries...");
    await Query.destroy({ where: {}, transaction });
    console.log("Wiping users (except admins)...");
    await User.destroy({ where: { role: { [Op.ne]: 'admin' } }, transaction });
    console.log("Wiping events...");
    await Event.destroy({ where: {}, transaction });

    // 3. Reset Auto-Increment
    const tables = ['attendances', 'otp_verifications', 'registrations', 'queries', 'users', 'events'];
    for (const table of tables) {
      console.log(`Resetting AUTO_INCREMENT for ${table}...`);
      try {
        await sequelize.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`, { transaction });
      } catch (e) {
         console.log(`Could not reset auto_increment for ${table}: ${e.message}`);
      }
    }

    console.log("--- COMMITING CHANGES ---");
    await transaction.commit();
    console.log("EMERGENCY RESET COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("EMERGENCY RESET FAILED:", err);
    process.exit(1);
  }
}

emergencyReset();
