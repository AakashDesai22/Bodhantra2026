const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Query = sequelize.define('Query', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('open', 'resolved'),
        defaultValue: 'open',
    },
}, {
    timestamps: true,
});


module.exports = Query;
