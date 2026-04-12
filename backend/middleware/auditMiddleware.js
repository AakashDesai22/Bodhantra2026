const { AuditLog } = require('../models');

const auditMiddleware = (req, res, next) => {
    // Only intercept state-changing requests
    const methodsToAudit = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!methodsToAudit.includes(req.method)) {
        return next();
    }

    res.on('finish', async () => {
        // Only log successful actions
        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                if (!req.user) return; // Need authenticated user context

                const actionMap = {
                    POST: 'Created',
                    PUT: 'Updated',
                    PATCH: 'Updated',
                    DELETE: 'Deleted'
                };

                // Determine action and target from URL
                let action = req.auditAction || `${actionMap[req.method]} Record`;
                let target = req.auditTarget || req.originalUrl;
                
                // Smart parsing for common targets
                if (!req.auditTarget && !req.auditAction) {
                    const url = req.originalUrl;
                    if (url.includes('/registrations/')) {
                        if (url.includes('status')) action = 'Updated Registration Status';
                        else if (url.includes('attendance')) action = 'Toggled Attendance';
                        else if (url.includes('resend-qr')) action = 'Resent QR Code';
                        else action = `${actionMap[req.method]} Registration`;
                        target = 'Registration Data';
                    } else if (url.includes('/queries/')) {
                        action = 'Responded to Query';
                        target = 'User Support';
                    } else if (url.includes('/users/')) {
                        if (url.includes('role')) action = 'Changed User Role';
                        else action = `${actionMap[req.method]} User Account`;
                        target = 'System Access';
                    } else if (url.includes('/invite')) {
                        action = 'Invited System Member';
                        target = 'System Access';
                    } else if (url.includes('/manual-add-participant')) {
                        action = 'Added Participant Manually';
                        target = 'Participant Management';
                    } else if (url.includes('/participant')) {
                        action = `${actionMap[req.method]} Participant Details`;
                        target = 'Participant Management';
                    } else if (url.includes('/danger/reset-platform')) {
                        action = 'Executed Critical Reset';
                        target = 'Platform Core';
                    } else if (url.includes('/upload-photo')) {
                        action = 'Uploaded Admin Photo';
                        target = 'Media Library';
                    } else if (url.includes('/attendance/scan')) {
                        action = 'Scanned QR Code';
                        target = 'Event Attendance';
                    } else if (url.includes('/reveal')) {
                        action = 'Triggered Winner Reveal';
                        target = 'Theme Hub';
                    } else if (url.includes('/allocation')) {
                        action = `${actionMap[req.method]} Allocation Rules`;
                        target = 'Assignment Engine';
                    }
                }

                await AuditLog.create({
                    userId: req.user.id,
                    userName: req.user.name,
                    userRole: req.user.role,
                    action,
                    target,
                    ipAddress: req.ip || req.connection.remoteAddress
                });
            } catch (err) {
                console.error('[AuditMiddleware] Failed to log action:', err);
            }
        }
    });

    next();
};

module.exports = auditMiddleware;
