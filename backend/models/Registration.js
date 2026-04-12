const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Registration = sequelize.define('Registration', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    payment_ss_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_method: {
        type: DataTypes.ENUM('online', 'offline'),
        defaultValue: 'online',
    },
    custom_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('custom_data');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('custom_data', value ? JSON.stringify(value) : null);
        },
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    attendance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    qr_code_data: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    isCertificateIssued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
});

module.exports = Registration;
