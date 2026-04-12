const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    registration_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    day_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    session_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    scanned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
});

module.exports = Attendance;
