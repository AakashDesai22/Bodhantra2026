const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { sequelize } = require('./models');

const app = express();

app.use(morgan('dev'));

// Manual log to guarantee visibility on Render
app.use((req, res, next) => {
  console.log(`>>> ${req.method} request to: ${req.url} at ${new Date().toISOString()}`);
  next();
});

app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:5174',
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// To serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api/allocation', require('./routes/allocationRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('API is running...');
});

const startServer = async () => {
    await connectDB();

    // Sync DB
    try {
        await sequelize.sync().then(async () => {
            console.log('Database synced (without alter: true for safety)');

            // One-time migration: remap legacy 'participant' role to 'user'
            try {
                const [results] = await sequelize.query(
                    "UPDATE Users SET role = 'user' WHERE role = 'participant'"
                );
                const affectedRows = results?.affectedRows || results?.rowCount || 0;
                if (affectedRows > 0) {
                    console.log(`[MIGRATION] Remapped ${affectedRows} 'participant' users to 'user' role`);
                }
            } catch (migrationErr) {
                // Silently ignore if 'participant' value doesn't exist in enum yet
                console.log('[MIGRATION] Role remap skipped (may already be complete)');
            }

            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }).catch((err) => {
            console.error('Failed to sync db: ', err);
            app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
        });
    } catch (err) {
        console.error('Failed to connect or sync db: ', err);
        app.listen(PORT, () => console.log(`Server started on port ${PORT} (DB sync failed)`));
    }
};

startServer();
