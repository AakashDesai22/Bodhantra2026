const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SystemConfig = sequelize.define('SystemConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supportPhone1Name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supportPhone1Number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supportPhone2Name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supportPhone2Number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    supportEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    instagramUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    linkedinUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
});

module.exports = SystemConfig;
