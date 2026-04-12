const { Registration, Event, User } = require('../models');
const { sendTemplateEmail } = require('./emailController');

// Save Certificate Config (PUT /api/admin/events/:id/certificate-config)
const saveCertificateConfig = async (req, res) => {
    try {
        const { certificateTemplates } = req.body;
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        event.certificateTemplates = certificateTemplates;
        await event.save();

        res.json({ message: 'Certificate config saved successfully', event });
    } catch (error) {
        console.error('Save Certificate Config Error:', error);
        res.status(500).json({ message: 'Server error saving certificate config' });
    }
};

// Issue Certificates (POST /api/admin/events/:id/issue-certificates)
const issueCertificates = async (req, res) => {
    try {
        const { registrationIds } = req.body;
        const event = await Event.findByPk(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
            return res.status(400).json({ message: 'Valid registrationIds array is required' });
        }

        // Update isCertificateIssued for selected registrations
        await Registration.update(
            { isCertificateIssued: true },
            { where: { id: registrationIds, event_id: event.id } }
        );

        // Return immediately so admin doesn't wait
        res.status(200).json({ 
            message: `Certificates issued for ${registrationIds.length} participants. Sending notification emails...` 
        });

        // Fetch registrations with user data for email sending (background)
        const registrations = await Registration.findAll({
            where: { id: registrationIds, event_id: event.id },
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        // Fire off emails in background
        for (const reg of registrations) {
            try {
                if (reg.User && reg.User.email) {
                    const subject = `Your Certificate for ${event.name} is Ready!`;
                    const body = `Congratulations! Your participation certificate for ${event.name} is now available.\n\nLog into your Bodhantra Dashboard to view and download your certificate as a high-quality PNG image.\n\nThank you for being a part of this event!`;

                    await sendTemplateEmail(
                        reg.User.email,
                        'generalAnnouncement',
                        reg.User.name,
                        event.name,
                        body,
                        null,
                        subject,
                        'CERTIFICATE'
                    );
                }
                // 200ms delay to avoid spam filters
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.error(`Failed to send certificate email to ${reg.User?.email}:`, err);
            }
        }
    } catch (error) {
        console.error('Issue Certificates Error:', error);
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error issuing certificates' });
        }
    }
};

module.exports = {
    saveCertificateConfig,
    issueCertificates,
};
