require('dotenv').config();
const { sequelize } = require('./config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        // Check current enum
        const [cols] = await sequelize.query(
            "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='role' AND TABLE_SCHEMA='" + process.env.DB_NAME + "'"
        );
        console.log('Current role enum:', cols[0]?.COLUMN_TYPE);

        // Step 1: Add new enum values temporarily (keep old ones)
        console.log('Step 1: Adding new enum values...');
        await sequelize.query(
            "ALTER TABLE Users MODIFY COLUMN role ENUM('user', 'member', 'admin', 'participant') DEFAULT 'user'"
        );

        // Step 2: Migrate participant -> user
        console.log('Step 2: Migrating participant -> user...');
        const [result] = await sequelize.query(
            "UPDATE Users SET role = 'user' WHERE role = 'participant'"
        );
        console.log('Rows updated:', result?.affectedRows || 0);

        // Step 3: Remove old enum value
        console.log('Step 3: Finalizing enum...');
        await sequelize.query(
            "ALTER TABLE Users MODIFY COLUMN role ENUM('user', 'member', 'admin') DEFAULT 'user'"
        );

        // Step 4: add mustChangePassword column if missing
        try {
            await sequelize.query(
                "ALTER TABLE Users ADD COLUMN mustChangePassword TINYINT(1) DEFAULT 0"
            );
            console.log('Added mustChangePassword column');
        } catch (e) {
            if (e.original?.code === 'ER_DUP_FIELDNAME') {
                console.log('mustChangePassword column already exists');
            } else {
                throw e;
            }
        }

        // Verify
        const [cols2] = await sequelize.query(
            "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='role' AND TABLE_SCHEMA='" + process.env.DB_NAME + "'"
        );
        console.log('New role enum:', cols2[0]?.COLUMN_TYPE);

        const [users] = await sequelize.query("SELECT id, name, role FROM Users");
        console.log('Current users:', users);

        console.log('\n✅ Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
