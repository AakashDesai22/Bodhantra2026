const { FeedbackResponse, Registration } = require('../models');

const submitFeedback = async (req, res) => {
    try {
        const { eventId, answers, rating, sessionName = 'General' } = req.body;
        const userId = req.user.id;

        // 1. Validate if user is approved for this event
        const registration = await Registration.findOne({
            where: { user_id: userId, event_id: eventId, status: 'approved' }
        });

        if (!registration) {
            return res.status(403).json({ message: 'You must have an approved registration to submit feedback for this event.' });
        }

        // 2. Prevent duplicate submissions per session
        const existingFeedback = await FeedbackResponse.findOne({
            where: { eventId, userId, sessionName }
        });

        if (existingFeedback) {
            return res.status(400).json({ message: `You have already submitted feedback for the ${sessionName} session of this event.` });
        }

        // 3. Save feedback
        const feedback = await FeedbackResponse.create({
            eventId,
            userId,
            sessionName,
            answers,
            rating
        });

        res.status(201).json({ message: 'Feedback submitted successfully.', feedback });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Internal server error while saving feedback' });
    }
};

module.exports = {
    submitFeedback
};
