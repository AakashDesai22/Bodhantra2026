const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    day_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    group_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    seat_row: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    seat_col: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_revealed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['event_id', 'user_id', 'day_number'],
        },
    ],
});

module.exports = Assignment;
