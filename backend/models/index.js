const { sequelize } = require('../config/db');
const User = require('./User');
const Event = require('./Event');
const Registration = require('./Registration');
const Query = require('./Query');
const Otp = require('./Otp');
const Attendance = require('./Attendance');
const SeatingGrid = require('./SeatingGrid');
const AllocationRule = require('./AllocationRule');
const Assignment = require('./Assignment');
const AuditLog = require('./AuditLog');
const SystemConfig = require('./SystemConfig');
const FeedbackResponse = require('./FeedbackResponse');

// Associations
User.hasMany(Registration, { foreignKey: 'user_id' });
Registration.belongsTo(User, { foreignKey: 'user_id' });

Event.hasMany(Registration, { foreignKey: 'event_id' });
Registration.belongsTo(Event, { foreignKey: 'event_id' });

User.hasMany(Query, { foreignKey: 'user_id' });
Query.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

Registration.hasMany(Attendance, { foreignKey: 'registration_id' });
Attendance.belongsTo(Registration, { foreignKey: 'registration_id' });

// Allocation Engine Associations
Event.hasOne(SeatingGrid, { foreignKey: 'event_id' });
SeatingGrid.belongsTo(Event, { foreignKey: 'event_id' });

Event.hasOne(AllocationRule, { foreignKey: 'event_id' });
AllocationRule.belongsTo(Event, { foreignKey: 'event_id' });

Event.hasMany(Assignment, { foreignKey: 'event_id' });
Assignment.belongsTo(Event, { foreignKey: 'event_id' });

User.hasMany(Assignment, { foreignKey: 'user_id' });
Assignment.belongsTo(User, { foreignKey: 'user_id' });

Event.hasMany(FeedbackResponse, { foreignKey: 'eventId' });
FeedbackResponse.belongsTo(Event, { foreignKey: 'eventId' });

User.hasMany(FeedbackResponse, { foreignKey: 'userId' });
FeedbackResponse.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    Event,
    Registration,
    Query,
    Otp,
    Attendance,
    SeatingGrid,
    AllocationRule,
    Assignment,
    AuditLog,
    SystemConfig,
    FeedbackResponse,
};
