const { Query, AuditLog } = require('../models');

// User asks a question
const createQuery = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const query = await Query.create({
            user_id: req.user.id,
            message,
        });

        // Explicitly log the query submission action
        AuditLog.create({
            userId: req.user.id,
            userName: req.user.name || 'Guest',
            userRole: req.user.role || 'Guest',
            action: 'Query Submitted',
            target: 'User Support',
            ipAddress: req.ip || req.connection.remoteAddress
        }).catch(err => console.error('AuditLog Error:', err));

        res.status(201).json(query);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// User gets their questions
const getMyQueries = async (req, res) => {
    try {
        const queries = await Query.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
        });
        res.json(queries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createQuery,
    getMyQueries,
};
