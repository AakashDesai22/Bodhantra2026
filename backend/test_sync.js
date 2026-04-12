require('dotenv').config();
const fs = require('fs');
const { sequelize } = require('./models');

(async () => {
    try {
        await sequelize.authenticate();
        
        // Check if columns exist, add them if they don't
        let output = '';
        
        try {
            const [evtCols] = await sequelize.query("SHOW COLUMNS FROM Events WHERE Field = 'attendance_sessions'");
            if (evtCols.length === 0) {
                await sequelize.query("ALTER TABLE Events ADD COLUMN attendance_sessions TEXT NULL");
                output += 'ADDED attendance_sessions to Events\n';
            } else {
                output += 'attendance_sessions already exists on Events\n';
            }
        } catch (e) {
            output += 'Events column check error: ' + e.message + '\n';
        }
        
        try {
            const [attCols] = await sequelize.query("SHOW COLUMNS FROM Attendances WHERE Field = 'session_id'");
            if (attCols.length === 0) {
                await sequelize.query("ALTER TABLE Attendances ADD COLUMN session_id VARCHAR(255) NULL");
                output += 'ADDED session_id to Attendances\n';
            } else {
                output += 'session_id already exists on Attendances\n';
            }
        } catch (e) {
            output += 'Attendances column check error: ' + e.message + '\n';
        }
        
        fs.writeFileSync('sync_result.txt', output);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('sync_result.txt', 'FATAL: ' + e.message);
        process.exit(1);
    }
})();
