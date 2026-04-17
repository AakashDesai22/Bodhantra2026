const baseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f3f4f6; 
            color: #374151; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            -webkit-font-smoothing: antialiased; 
        }
        .wrapper { 
            width: 100%; 
            table-layout: fixed; 
            background-color: #f3f4f6; 
            padding: 40px 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
        }
        
        /* Elegant Header */
        .header { 
            padding: 32px 40px; 
            background: #ffffff; 
            border-bottom: 1px solid #e5e7eb;
            text-align: center;
        }
        .brand { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 800; 
            color: #111827; 
            letter-spacing: -0.5px; 
        }
        
        /* Clean Content Area */
        .content { 
            padding: 40px; 
            font-size: 16px; 
            line-height: 1.6; 
            color: #4b5563;
        }
        h2 { 
            color: #111827; 
            font-size: 20px; 
            margin-top: 0; 
            font-weight: 600;
        }
        p { 
            margin: 0 0 20px 0; 
        }
        .highlight { 
            color: #111827; 
            font-weight: 600; 
        }
        
        /* Professional Badges */
        .badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 9999px; 
            font-size: 13px; 
            font-weight: 600; 
        }
        .badge-pending { 
            background: #fef3c7; 
            color: #d97706; 
        }
        .badge-success { 
            background: #d1fae5; 
            color: #059669; 
        }
        
        /* Info Cards */
        .info-card { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 24px; 
            margin: 24px 0; 
        }
        
        /* Premium Buttons */
        .btn-container { 
            margin: 32px 0; 
            text-align: center;
        }
        .btn { 
            display: inline-block; 
            background: #2563eb; 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 32px; 
            font-weight: 500; 
            border-radius: 8px; 
            transition: background-color 0.2s; 
        }
        
        /* Modern Apple-Wallet Style QR Section */
        .qr-wrapper { 
            text-align: center; 
            margin: 32px 0; 
            padding: 32px; 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
        }
        .qr-label { 
            font-weight: 600; 
            color: #64748b; 
            margin-bottom: 16px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            font-size: 13px; 
            display: block; 
        }
        .qr-code { 
            width: 200px; 
            height: 200px; 
            padding: 16px; 
            background: #ffffff; 
            border-radius: 12px; 
            margin: 0 auto; 
            display: block; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        }
        
        /* Minimalist Footer */
        .footer { 
            padding: 32px 40px; 
            background: #f9fafb; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            font-size: 13px; 
            color: #6b7280; 
        }
        
        @media only screen and (max-width: 600px) {
            .wrapper { padding: 0; }
            .container { border-radius: 0; box-shadow: none; }
            .header { padding: 24px 20px; }
            .content { padding: 32px 20px; }
            .footer { padding: 24px 20px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1 class="brand">Team Mavericks</h1>
            </div>
            <div class="content">
                ${bodyContent}
            </div>
            <div class="footer">
                <p style="margin-bottom: 8px;">&copy; ${new Date().getFullYear()} Team Mavericks. All rights reserved.</p>
                <p style="margin: 0;">If you have any questions, simply reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const templates = {
    // 1. Triggered immediately after form submission
    registrationReceived: (name, event, customBody, whatsappLink, paymentMode, offlineManagersHtml) => baseTemplate(
        `Registration Received - ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Thank you for registering for <strong>${event}</strong>. We have successfully received your application.</p>
        
        ${paymentMode === 'offline' ? `
        <p>Status: <span class="badge badge-pending">Payment Initialized / Action Required</span></p>
        <p>Your registration is almost complete! To secure your spot and receive your official Event Pass, you must complete your offline payment.</p>
        
        ${offlineManagersHtml ? `
        <div class="info-card" style="border-left: 4px solid #f59e0b;">
            <h2 style="font-size: 16px; margin-bottom: 12px; color: #b45309;">Contact Offline Managers</h2>
            <p style="font-size: 14px; margin-bottom: 16px;">Please reach out to any of our dedicated team members below to complete your payment.</p>
            ${offlineManagersHtml}
        </div>
        ` : ''}
        ` : `
        <p>Status: <span class="badge badge-pending">Pending Verification</span></p>
        <p>Our team is currently reviewing your payment receipt. Once verified, we will send you an official confirmation email along with your Event Pass QR code.</p>
        
        ${whatsappLink ? `
        <div class="info-card">
            <h2 style="font-size: 16px; margin-bottom: 8px;">Join the Community</h2>
            <p style="font-size: 15px; margin-bottom: 20px;">Get the latest updates, schedules, and announcements directly on our official WhatsApp group.</p>
            <a href="${whatsappLink}" class="btn" style="background: #10b981; padding: 10px 24px; width: 100%; box-sizing: border-box; text-align: center;">Join WhatsApp Group</a>
        </div>
        ` : ''}
        `}
        
        <p>We appreciate your patience and will be in touch shortly.</p>
        `
    ),

    // Used for payment approval
    paymentApproved: (name, event, customBody, qrCodeDataUrl, whatsappLink) => baseTemplate(
        `Registration Confirmed - ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Great news! Your payment has been successfully verified, and your registration for <strong>${event}</strong> is <span class="badge badge-success">Confirmed</span>.</p>
        
        ${qrCodeDataUrl ? `
        <div class="qr-wrapper">
            <span class="qr-label">Official Event Pass</span>
            <img src="cid:qrcode" alt="Event Pass QR Code" class="qr-code" />
            <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Please present this QR code at the registration desk upon arrival.</p>
        </div>
        ` : ''}
        
        ${whatsappLink ? `
        <div class="info-card" style="margin-top: 5px; text-align: center;">
            <p style="font-size: 15px; margin-bottom: 12px; font-weight: 500;">Don't forget to join our WhatsApp group for live updates!</p>
            <a href="${whatsappLink}" class="btn" style="background: #10b981; padding: 10px 24px; display: inline-block;">Join WhatsApp Group</a>
        </div>
        ` : ''}
        
        <p>We look forward to hosting you. You can access your itinerary and pass at any time via your participant dashboard.</p>
        `
    ),

    // 2. Triggered when an Admin rejects a participant
    paymentRejected: (name, event, customBody, qrCodeDataUrl, offlineManagersHtml) => baseTemplate(
        `Action Required: Registration Issue - ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>We encountered an issue while reviewing your registration for <strong>${event}</strong>. Our team has left the following note regarding your application:</p>
        
        <div class="info-card" style="border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #111827; font-weight: 500;">${customBody || 'We were unable to verify your payment receipt. Please ensure the document uploaded is clear and valid.'}</p>
        </div>
        
        <p>Please log in to your dashboard to update your information or re-upload your document so we can secure your spot.</p>
        
        <div class="btn-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Go to Dashboard</a>
        </div>

        ${offlineManagersHtml ? `
        <div class="info-card" style="border-top: 3px solid #38bdf8; margin-top: 32px; background: #f0f9ff;">
            <h2 style="font-size: 16px; margin-bottom: 12px; color: #0369a1;">Need Help? Contact Support</h2>
            <p style="font-size: 14px; margin-bottom: 16px;">If you're having trouble uploading or if you'd like to switch to an offline payment method, reach out to our team:</p>
            ${offlineManagersHtml === 'Team Mavericks Update' || offlineManagersHtml === 'undefined' ? '' : offlineManagersHtml}
        </div>
        ` : `
        <div class="info-card" style="border-top: 3px solid #38bdf8; margin-top: 32px; background: #f0f9ff;">
            <h2 style="font-size: 16px; margin-bottom: 12px; color: #0369a1;">Need Help? Contact Support</h2>
            <p style="font-size: 14px; margin-bottom: 16px;">If you're having trouble uploading or if you'd like to switch to an offline payment method, reach out to the event organizers for manual assistance.</p>
        </div>
        `}
        `
    ),

    // 3. Triggered by the QR Scanner logic
    checkInSuccess: (name, event) => baseTemplate(
        `Welcome to ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Welcome to <strong>${event}</strong>! Your check-in was successful.</p>
        
        <div class="info-card">
            <p style="margin: 0;">You can view the full event schedule, announcements, and resources directly from your dashboard.</p>
        </div>
        
        <div class="btn-container" style="margin-top: 24px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">View Dashboard</a>
        </div>
        <p>We hope you have an incredible experience!</p>
        `
    ),

    // 4. Flexible template for mass mailing
    generalAnnouncement: (name, event, customBody, qrCodeDataUrl, subject, announcementType) => baseTemplate(
        subject || `Update from Team Mavericks - ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        
        ${announcementType ? `
        <div style="margin: 20px 0; display: inline-block; background: #6366f1; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
            ${announcementType}
        </div>
        ` : ''}

        <div style="margin-top: 16px; color: #4b5563;">
            ${customBody ? customBody.split('\n').map(line => `<p>${line}</p>`).join('') : '<p>We have a new update regarding the event.</p>'}
        </div>
        `
    ),

    // 5. Post-event template
    eventFeedback: (name, event, feedbackData) => baseTemplate(
        `Thank you for attending ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Thank you for being a part of <strong>${event}</strong>. We hope you enjoyed the experience as much as we enjoyed hosting you!</p>
        
        <div class="info-card">
            <h2 style="font-size: 16px; margin-bottom: 8px;">We value your feedback</h2>
            <p style="font-size: 15px; margin-bottom: 20px;">Please take a moment to share your thoughts so we can make our future events even better and get your digital certificate!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn" style="width: 100%; box-sizing: border-box; text-align: center;">Go to Dashboard</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">Note: Your digital participation certificate will be available to download from your dashboard soon.</p>
        `
    ),

    // 6. Dedicated "No-Fuss" Event Pass resend
    resendQR: (name, event, uniqueId, qrCodeDataUrl) => baseTemplate(
        `Your Event Pass - ${event}`,
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>As requested, here is your official Event Pass for <strong>${event}</strong>.</p>
        

        
        ${qrCodeDataUrl ? `
        <div class="qr-wrapper">
            <span class="qr-label">Official Event Pass</span>
            <img src="cid:qrcode" alt="Event Pass QR Code" class="qr-code" />
        </div>
        ` : '<p style="color: #ef4444;">Error generating pass. Please contact support.</p>'}
        `
    ),

    // 7. Welcome email for invited members
    memberWelcome: (name, email, tempPassword, qrCodeDataUrl, whatsappLink) => baseTemplate(
        'Welcome to Team Mavericks',
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>You have been invited to join the <strong>Team Mavericks</strong> dashboard as a Member.</p>
        <p>Your account is ready. Please use the credentials below to log in to the administrative portal.</p>
        
        <div class="info-card" style="padding: 0; overflow: hidden; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 40%;">Email</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600; text-align: right;">${email}</td>
                </tr>
                <tr>
                    <td style="padding: 16px 20px; color: #6b7280; font-size: 14px;">Temporary Password</td>
                    <td style="padding: 16px 20px; color: #111827; font-weight: 600; font-family: monospace; font-size: 16px; text-align: right; letter-spacing: 1px;">${tempPassword}</td>
                </tr>
            </table>
        </div>

        <div class="btn-container">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Log in to Dashboard</a>
        </div>

        ${whatsappLink ? `
        <div class="info-card" style="margin-top: 10px; background: #ecfdf5; border-color: #6ee7b7; text-align: center;">
            <h2 style="font-size: 16px; margin-bottom: 8px; color: #065f46;">Join the Core Team WhatsApp Group</h2>
            <p style="font-size: 15px; margin-bottom: 16px; color: #047857;">Get onboarded and communicate with the rest of the administration team.</p>
            <a href="${whatsappLink}" class="btn" style="background: #10b981; padding: 10px 24px; display: inline-block;">Join WhatsApp Group</a>
        </div>
        ` : ''}

        <p style="font-size: 14px; color: #6b7280;">For your security, please update your password immediately after logging in for the first time.</p>
        `
    ),

    // 8. OTP Template for Registration
    registrationOtp: (name, otp) => baseTemplate(
        'Registration OTP - Team Mavericks',
        `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Your One-Time Password (OTP) for registration is:</p>
        <div style="background: #f3f4f6; padding: 24px; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb;">
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #111827; margin: 0; font-family: monospace;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes. For your security, please do not share this code with anyone.</p>
        <p>If you did not request this OTP, please ignore this email or contact support if you have concerns.</p>
        `
    )
};


module.exports = templates;