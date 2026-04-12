const { SystemConfig } = require('../models');

// Fetch the system configuration (Singleton)
exports.getSupportConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            // Return default empty values if no row exists yet
            return res.status(200).json({
                supportPhone1Name: '',
                supportPhone1Number: '',
                supportPhone2Name: '',
                supportPhone2Number: '',
                supportEmail: '',
                instagramUrl: '',
                linkedinUrl: ''
            });
        }
        res.status(200).json(config);
    } catch (error) {
        console.error('Error fetching support config:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update or create the system configuration
exports.updateSupportConfig = async (req, res) => {
    try {
        const {
            supportPhone1Name,
            supportPhone1Number,
            supportPhone2Name,
            supportPhone2Number,
            supportEmail,
            instagramUrl,
            linkedinUrl
        } = req.body;

        let config = await SystemConfig.findOne();
        if (config) {
            config = await config.update({
                supportPhone1Name,
                supportPhone1Number,
                supportPhone2Name,
                supportPhone2Number,
                supportEmail,
                instagramUrl,
                linkedinUrl
            });
        } else {
            config = await SystemConfig.create({
                supportPhone1Name,
                supportPhone1Number,
                supportPhone2Name,
                supportPhone2Number,
                supportEmail,
                instagramUrl,
                linkedinUrl
            });
        }

        res.status(200).json({ message: 'Support configuration updated successfully!', config });
    } catch (error) {
        console.error('Error updating support config:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
