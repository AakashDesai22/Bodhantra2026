const { sequelize, User, Registration, Event, Query, Attendance, AuditLog } = require('./models');

const testDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Test queries from Analytics
        const trends = await sequelize.query(`
            SELECT DATE(createdAt) as date, COUNT(*) as count 
            FROM Registrations 
            GROUP BY DATE(createdAt) 
            ORDER BY date ASC 
            LIMIT 30
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('Trends:', trends);

        const memberActivity = await sequelize.query(`
            SELECT userName, COUNT(*) as count 
            FROM AuditLogs 
            WHERE userRole IN ('member', 'admin') 
              AND (action LIKE '%Invite%' OR action LIKE '%Reveal%')
            GROUP BY userName
            ORDER BY count DESC
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('Activity:', memberActivity);

        console.log('All tests passed');
    } catch (error) {
        console.error('Unable to execute expected query:', error);
    } finally {
        process.exit();
    }
}

testDb();
