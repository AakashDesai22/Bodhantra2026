const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SeatingGrid = sequelize.define('SeatingGrid', {
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
    rows: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
    },
    cols: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 6,
    },
    blocked_cells: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('blocked_cells');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('blocked_cells', JSON.stringify(value || []));
        },
    },
    zone_map: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('zone_map');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('zone_map', JSON.stringify(value || []));
        },
    },
    is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
});

module.exports = SeatingGrid;
