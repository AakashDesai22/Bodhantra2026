const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeedbackResponse = sequelize.define('FeedbackResponse', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sessionName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'General',
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    answers: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('answers');
            return raw ? JSON.parse(raw) : {};
        },
        set(value) {
            this.setDataValue('answers', value ? JSON.stringify(value) : null);
        },
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    isHidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    timestamps: true,
});

module.exports = FeedbackResponse;
