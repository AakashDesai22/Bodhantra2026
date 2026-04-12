const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    venue: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    poster_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    qr_code_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    offline_payment: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    payment_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    require_online_payment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    require_offline_payment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    offline_payment_contacts: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('offline_payment_contacts');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('offline_payment_contacts', value ? JSON.stringify(value) : null);
        },
    },
    custom_fields: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('custom_fields');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('custom_fields', JSON.stringify(value));
        },
    },
    status: {
        type: DataTypes.ENUM('active', 'past'),
        defaultValue: 'active',
    },
    whatsapp_link: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_details: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    participant_limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    event_duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    registration_open: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    attendance_sessions: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('attendance_sessions');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('attendance_sessions', value ? JSON.stringify(value) : null);
        },
    },
    isFeedbackEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    feedbackQuestions: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('feedbackQuestions');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('feedbackQuestions', value ? JSON.stringify(value) : null);
        },
    },
    isCountdownEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    countdownTargetDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    feedbackTitle: {
        type: DataTypes.STRING,
        defaultValue: 'Event Feedback',
    },
    feedbackSessions: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('feedbackSessions');
            return raw ? JSON.parse(raw) : ['General'];
        },
        set(value) {
            this.setDataValue('feedbackSessions', value ? JSON.stringify(value) : null);
        },
    },
    certificateTemplates: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        get() {
            const raw = this.getDataValue('certificateTemplates');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('certificateTemplates', value ? JSON.stringify(value) : null);
        },
    },
}, {
    timestamps: true,
});

module.exports = Event;
