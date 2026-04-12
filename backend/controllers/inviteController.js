const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { User } = require('../models');
const templates = require('../utils/emailTemplates');
const { generateUniqueID } = require('./adminController');

// Configure nodemailer (same as emailController)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * POST /api/admin/invite
 * Invite a new member via email with temporary credentials.
 */
const inviteMember = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        // Validate required fields
        if (!name || !email || !phone) {
            return res.status(400).json({ message: 'Name, email, and phone number are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'A user with this email already exists' });
        }

        // Use phone number as the temporary password
        const tempPassword = phone.trim();

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Generate member unique ID
        const uniqueId = await generateUniqueID('member');

        // Create the member user
        const newUser = await User.create({
            name,
            email,
            phone: phone || null,
            password: hashedPassword,
            role: 'member',
            mustChangePassword: true,
            unique_id: uniqueId,
        });

        // Send welcome email with credentials
        try {
            const htmlContent = templates.memberWelcome(name, email, tempPassword);
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Welcome to Team Mavericks — Your Dashboard Access',
                html: htmlContent,
            };

            if (process.env.EMAIL_USER) {
                await transporter.sendMail(mailOptions);
            } else {
                console.log(`\n=========================================`);
                console.log(`[DEV] Welcome email for ${email}`);
                console.log(`[DEV] Temp password: ${tempPassword}`);
                console.log(`=========================================\n`);
            }
        } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
            // Don't fail the request — user was created successfully
        }

        res.status(201).json({
            message: `Member invited successfully. Welcome email sent to ${email}.`,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Error inviting member:', error);
        res.status(500).json({ message: 'Server error while inviting member' });
    }
};

/**
 * GET /api/admin/users
 * Fetch all users for the admin User Management view.
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * PATCH /api/admin/users/:id/role
 * Update a user's role (user ↔ member). Cannot modify admin accounts.
 */
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'member'].includes(role)) {
            return res.status(400).json({ message: 'Role must be either "user" or "member"' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent modifying admin accounts
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot modify admin role' });
        }

        // Prevent modifying your own role
        if (user.id === req.user.id) {
            return res.status(403).json({ message: 'Cannot modify your own role' });
        }

        // If becoming a member, ensure they have a unique_id (or they'll keep PRT if they have one)
        if (role === 'member' && !user.unique_id) {
            user.unique_id = await generateUniqueID('member');
        }

        user.role = role;
        await user.save();

        res.json({
            message: `User role updated to ${role}`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * PATCH /api/admin/users/:id
 * Update user details (name, phone, etc).
 */
const updateUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent modifying admin accounts if not the same admin
        if (user.role === 'admin' && user.id !== req.user.id) {
            return res.status(403).json({ message: 'Cannot modify other admin accounts' });
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        
        await user.save();

        res.json({
            message: 'User details updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user from the system.
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting admin accounts
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin accounts' });
        }

        // Delete user
        await user.destroy();

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};

module.exports = { inviteMember, getAllUsers, updateUserRole, updateUserDetails, deleteUser };
