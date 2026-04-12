const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AllocationRule = sequelize.define('AllocationRule', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    mode: {
        type: DataTypes.ENUM('group', 'pair', 'squad'),
        allowNull: false,
        defaultValue: 'group',
    },
    group_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
    },
    mix_branches: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    no_repeat_pairs: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    custom_constraints: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '{}',
        get() {
            const raw = this.getDataValue('custom_constraints');
            return raw ? JSON.parse(raw) : {};
        },
        set(value) {
            this.setDataValue('custom_constraints', JSON.stringify(value || {}));
        },
    },
}, {
    timestamps: true,
});

module.exports = AllocationRule;
