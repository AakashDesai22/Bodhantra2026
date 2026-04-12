const axios = require('axios');
const nodemailer = require('nodemailer');
const { Otp, User, Registration, Event } = require('../models');
const templates = require('../utils/emailTemplates');

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const otpMemoryCache = new Map();

const getEmailJsKeys = () => {
    return {
        serviceId: process.env.EMAILJS_SERVICE_ID || process.env.EMAIL_JS_SERVICE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY || process.env.EMAIL_JS_PUBLIC_KEY,
        templateId: process.env.EMAILJS_TEMPLATE_ID || process.env.EMAIL_JS_TEMPLATE_ID,
        privateKey: process.env.EMAILJS_PRIVATE_KEY || process.env.EMAIL_JS_PRIVATE_KEY
    };
};

const createTransporter = () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return null;
};

const sendMailDirect = async (to, subject, html) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.log('>>> BACKEND WARN: Nodemailer credentials missing, checking fallbacks...');
        return false;
    }
    try {
        console.log(`>>> BACKEND: Sending email via Nodemailer (Gmail) to ${to}`);
        await transporter.sendMail({
            from: `"Bodhantra 2026" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`>>> BACKEND: Email sent successfully via Nodemailer.`);
        return true;
    } catch (err) {
        console.error('>>> BACKEND ERROR: Nodemailer direct send failed:', err.message);
        return false;
    }
};

const callHostingerMailer = async (data) => {
    const phpMailerUrl = process.env.PHP_MAILER_URL;
    const phpMailerKey = process.env.PHP_MAILER_KEY;

    if (!phpMailerUrl || !phpMailerKey) return false;

    try {
        const params = new URLSearchParams();
        params.append('api_key', phpMailerKey);
        params.append('to_email', data.to_email);
        params.append('otp', data.otp || '');
        params.append('user_name', data.user_name || '');
        params.append('subject', data.subject || '');
        params.append('whatsapp_link', data.whatsapp_link || 'https://chat.whatsapp.com/GH1GAB47UAW27EPcqVGbBb');
        
        await axios.post(phpMailerUrl, params);
        console.log('>>> BACKEND: Hostinger Email Sender fallback used.');
        return true;
    } catch (error) {
        console.error('>>> BACKEND ERROR: Hostinger PHP Mailer failed:', error.message);
        return false;
    }
};

const sendOtp = async (req, res) => {
    console.log('>>> BACKEND: sendOtp requested for:', req.body.email);
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const userName = name || email.split('@')[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 10 * 60000);
        
        try {
            await Otp.destroy({ where: { email } });
            await Otp.create({ email, otp, expires_at });
        } catch (dbError) {
            otpMemoryCache.set(email, { otp, expires_at });
        }

        console.log(`\n=========================================\n[LOCAL LOG] OTP for ${email}: ${otp}\n=========================================\n`);
        
        // 1. Try Nodemailer First
        const htmlOtp = `
        <div style="font-family: sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #111827;">Registration OTP</h2>
            <p>Hi ${userName},</p>
            <p>Your One-Time Password for event registration is:</p>
            <div style="margin: 20px auto; padding: 15px; background: #f3f4f6; border-radius: 8px; max-width: 300px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
                ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
        </div>`;
        
        let success = await sendMailDirect(email, 'Bodhantra 2026 - Registration OTP', htmlOtp);

        // 2. Fallback to Hostinger
        if (!success) {
            success = await callHostingerMailer({
                to_email: email, user_name: userName, otp: otp, subject: 'Bodhantra 2026 - Registration OTP'
            });
        }

        // 3. Fallback to EmailJS
        if (!success) {
            try {
                const keys = getEmailJsKeys();
                if (keys.serviceId && keys.publicKey) {
                    await axios.post(EMAILJS_URL, {
                        service_id: keys.serviceId, template_id: keys.templateId, user_id: keys.publicKey, accessToken: keys.privateKey,
                        template_params: { to_email: email, user_name: userName, otp: otp, subject: 'Bodhantra 2026 - Registration OTP' }
                    });
                }
            } catch (e) {
                 console.error('>>> BACKEND ERROR: EmailJS completely failed too', e.message);
            }
        }

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

const sendRegistrationEmail = async (email, name, eventName, date, venue, whatsappLink, paymentMethod, managersHtml) => {
    try {
        const title = `Registration Confirmed - ${eventName}`;
        let html;
        if (paymentMethod === 'offline') {
             html = templates.registrationReceived(name, eventName, '', whatsappLink, paymentMethod, managersHtml);
        } else {
             html = templates.registrationReceived(name, eventName, '', whatsappLink, paymentMethod, null);
        }

        let success = await sendMailDirect(email, title, html);
        
        if (!success) {
            success = await callHostingerMailer({ to_email: email, user_name: name, otp: 'CONFIRMED', subject: title });
            if (!success) {
                const keys = getEmailJsKeys();
                if (keys.serviceId) {
                    await axios.post(EMAILJS_URL, {
                        service_id: keys.serviceId, template_id: keys.templateId, user_id: keys.publicKey, accessToken: keys.privateKey,
                        template_params: { to_email: email, user_name: name, event_name: eventName, event_date: date, event_venue: venue, whatsapp_link: whatsappLink, subject: title }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error sending registration email:', error.message);
    }
};

const sendTemplateEmail = async (email, subject, templateName, data) => {
    try {
        let htmlContent = '';
        if (templateName === 'broadcast' && templates.generalAnnouncement) {
            htmlContent = templates.generalAnnouncement(data.user_name || email.split('@')[0], data.eventName || 'Event', data.message, '', subject, '');
        }

        let success = false;
        if (htmlContent) {
           success = await sendMailDirect(email, subject, htmlContent);
        }

        if (!success) {
            success = await callHostingerMailer({ to_email: email, subject: subject, user_name: data.user_name || email.split('@')[0], otp: data.message || '' });
            if (!success) {
                const keys = getEmailJsKeys();
                if (keys.serviceId) {
                     await axios.post(EMAILJS_URL, { 
                        service_id: keys.serviceId, template_id: keys.templateId, user_id: keys.publicKey, accessToken: keys.privateKey, 
                        template_params: { to_email: email, subject: subject, ...data } 
                     });
                }
            }
        }
    } catch (error) {
        console.error('Error sending Template Email:', error.message);
    }
};

const sendBulkEmails = async (req, res) => {
    try {
        const { emails, subject, message, eventName } = req.body;
        if (!emails || !Array.isArray(emails)) return res.status(400).json({ message: 'No emails provided' });
        res.status(200).json({ message: `Started background broadcast to ${emails.length} recipients.` });
        for (const email of emails) {
            await sendTemplateEmail(email, subject, 'broadcast', { message, eventName });
            await new Promise(resolve => setTimeout(resolve, 500)); 
        }
    } catch (error) {
        console.error('Bulk email failed:', error);
    }
};

const verifyOtp = async (email, otp) => {
    try {
        try {
            const dbRecord = await Otp.findOne({ where: { email, otp } });
            if (dbRecord) {
                if (dbRecord.expires_at > new Date()) {
                    await Otp.destroy({ where: { email } }).catch(() => {});
                    return true;
                }
            }
        } catch (e) {}

        const memRecord = otpMemoryCache.get(email);
        if (memRecord && memRecord.otp === otp) {
            if (memRecord.expires_at > new Date()) {
                otpMemoryCache.delete(email);
                return true;
            }
        }
        return false;
    } catch (error) {
        return false;
    }
};

module.exports = { sendOtp, verifyOtp, sendRegistrationEmail, sendTemplateEmail, sendBulkEmails };
