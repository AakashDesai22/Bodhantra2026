const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    prn: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, // Admin might not have a PRN
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('user', 'member', 'admin'),
        defaultValue: 'user',
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mustChangePassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    college: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    branch: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    year: {
        type: DataTypes.ENUM('FY', 'SY', 'TY', 'Final', 'Other'),
        allowNull: true,
    },
    unique_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    profile_picture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = User;
