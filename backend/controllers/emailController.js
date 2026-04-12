const axios = require('axios');
const { Otp, User, Registration, Event } = require('../models');
// We don't strictly need templates for EmailJS since it uses its own templates
const templates = require('../utils/emailTemplates');

// EmailJS Configuration
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

// Memory fallback for OTPs (if DB is unreachable)
const otpMemoryCache = new Map();

// Helper to get environment variables regardless of underscore naming
const getEmailJsKeys = () => {
    return {
        serviceId: process.env.EMAILJS_SERVICE_ID || process.env.EMAIL_JS_SERVICE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY || process.env.EMAIL_JS_PUBLIC_KEY,
        templateId: process.env.EMAILJS_TEMPLATE_ID || process.env.EMAIL_JS_TEMPLATE_ID,
        privateKey: process.env.EMAILJS_PRIVATE_KEY || process.env.EMAIL_JS_PRIVATE_KEY
    };
};

// Helper to call Hostinger PHP Mailer
const callHostingerMailer = async (data) => {
    const phpMailerUrl = process.env.PHP_MAILER_URL;
    const phpMailerKey = process.env.PHP_MAILER_KEY;

    if (!phpMailerUrl || !phpMailerKey) {
        console.warn('>>> PHP Mailer not configured, falling back to EmailJS if available.');
        return false;
    }

    try {
        const params = new URLSearchParams();
        params.append('api_key', phpMailerKey);
        params.append('to_email', data.to_email);
        params.append('otp', data.otp || '');
        params.append('user_name', data.user_name || '');
        params.append('subject', data.subject || '');
        params.append('whatsapp_link', data.whatsapp_link || 'https://chat.whatsapp.com/GH1GAB47UAW27EPcqVGbBb');
        // Optional: add more fields if needed

        console.log('>>> BACKEND: Calling Hostinger PHP Mailer at:', phpMailerUrl);
        const response = await axios.post(phpMailerUrl, params);
        console.log('>>> BACKEND: Hostinger Response:', response.data);
        return true;
    } catch (error) {
        console.error('>>> BACKEND ERROR: Hostinger PHP Mailer failed:', error.response?.data || error.message);
        return false;
    }
};

const sendOtp = async (req, res) => {
    console.log('>>> BACKEND: sendOtp requested for:', req.body.email);
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const userName = name || email.split('@')[0];

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 10 * 60000);
        
        try {
            console.log('>>> BACKEND: Attempting to save OTP to Database...');
            await Otp.destroy({ where: { email } });
            await Otp.create({ email, otp, expires_at });
            console.log('>>> BACKEND: OTP saved to database.');
        } catch (dbError) {
            console.error('>>> BACKEND WARNING: Database unreachable. Using Memory Fallback for OTP.');
            otpMemoryCache.set(email, { otp, expires_at });
        }

        const { serviceId, publicKey, templateId, privateKey } = getEmailJsKeys();
        const emailjsData = {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            accessToken: privateKey,
            template_params: {
                to_email: email,
                user_name: email.split('@')[0],
                otp: otp,
                subject: 'Bodhantra 2026 - Registration OTP'
            }
        };

        console.log(`\n=========================================\n[LOCAL LOG] OTP for ${email}: ${otp}\n=========================================\n`);
        
        // Try Hostinger First
        const hostingerSuccess = await callHostingerMailer({
            to_email: email,
            user_name: userName,
            otp: otp,
            subject: 'Bodhantra 2026 - Registration OTP',
            whatsapp_link: 'https://chat.whatsapp.com/GH1GAB47UAW27EPcqVGbBb'
        });

        if (!hostingerSuccess) {
            try {
                const { serviceId, publicKey, templateId, privateKey } = getEmailJsKeys();
                if (serviceId && publicKey) {
                    console.log('>>> BACKEND: Sending email via EmailJS (Fallback)...');
                    await axios.post(EMAILJS_URL, emailjsData);
                    console.log('>>> BACKEND: Email sent successfully via EmailJS.');
                }
            } catch (mailError) {
                console.error('>>> BACKEND ERROR: EmailJS Fallback failed. Check activity history in Dashboard.');
            }
        }

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('>>> BACKEND ERROR: Global failure in sendOtp:', error.message);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

const sendRegistrationEmail = async (email, name, eventName, date, venue, whatsappLink, paymentMethod, managersHtml) => {
    try {
        const { serviceId, publicKey, templateId, privateKey } = getEmailJsKeys();
        if (!serviceId) return; // Silent return if not configured

        console.log(`>>> BACKEND: Sending Registration Email for ${eventName} to ${email}...`);

        const hostingerSuccess = await callHostingerMailer({
            to_email: email,
            user_name: name,
            otp: 'CONFIRMED', // Custom label if needed
            subject: `Registration Confirmed - ${eventName}`
        });

        if (!hostingerSuccess) {
            const { serviceId, publicKey, templateId, privateKey } = getEmailJsKeys();
            if (serviceId) {
                await axios.post(EMAILJS_URL, {
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    accessToken: privateKey,
                    template_params: {
                        to_email: email,
                        user_name: name,
                        event_name: eventName,
                        event_date: date,
                        event_venue: venue,
                        whatsapp_link: whatsappLink,
                        subject: `Registration Confirmed - ${eventName}`
                    }
                });
                console.log('>>> BACKEND: Registration Email sent successfully via EmailJS Fallback.');
            }
        }
    } catch (error) {
        console.error('Error sending registration email:', error.response?.data || error.message);
    }
};

const sendTemplateEmail = async (email, subject, templateName, data) => {
    try {
        console.log(`>>> BACKEND: Sending Template Email (${templateName}) to ${email}...`);
        
        const hostingerSuccess = await callHostingerMailer({
            to_email: email,
            subject: subject,
            user_name: data.user_name || email.split('@')[0],
            otp: data.otp || data.message || '' // Using otp field for message content in custom templates
        });

        if (!hostingerSuccess) {
            const { serviceId, publicKey, templateId, privateKey } = getEmailJsKeys();
            if (serviceId) {
                await axios.post(EMAILJS_URL, {
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    accessToken: privateKey,
                    template_params: {
                        to_email: email,
                        subject: subject,
                        ...data
                    }
                });
                console.log('>>> BACKEND: Template Email sent successfully via EmailJS Fallback.');
            }
        } else {
            console.log('>>> BACKEND: Template Email sent successfully via Hostinger.');
        }
    } catch (error) {
        console.error('Error sending Template Email:', error.response?.data || error.message);
    }
};

const sendBulkEmails = async (req, res) => {
    try {
        const { emails, subject, message, eventName } = req.body;
        if (!emails || !Array.isArray(emails)) return res.status(400).json({ message: 'No emails provided' });

        res.status(200).json({ message: `Started background broadcast to ${emails.length} recipients.` });

        for (const email of emails) {
            await sendTemplateEmail(email, subject, 'broadcast', { message, eventName });
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit delay
        }
    } catch (error) {
        console.error('Bulk email failed:', error);
    }
};

const verifyOtp = async (email, otp) => {
    try {
        console.log(`>>> BACKEND: Verifying OTP for ${email}...`);
        
        // 1. Try Database first
        try {
            const dbRecord = await Otp.findOne({ where: { email, otp } });
            if (dbRecord) {
                const now = new Date();
                if (dbRecord.expires_at > now) {
                    await Otp.destroy({ where: { email } }).catch(() => {});
                    return true;
                }
            }
        } catch (e) {
            console.log('>>> BACKEND INFO: DB check failed for OTP, moving to memory fallback.');
        }

        // 2. Try Memory Fallback
        const memRecord = otpMemoryCache.get(email);
        if (memRecord && memRecord.otp === otp) {
            const now = new Date();
            if (memRecord.expires_at > now) {
                otpMemoryCache.delete(email);
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('>>> BACKEND ERROR: Total OTP Verification failure:', error.message);
        return false;
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    sendRegistrationEmail,
    sendTemplateEmail,
    sendBulkEmails
};
