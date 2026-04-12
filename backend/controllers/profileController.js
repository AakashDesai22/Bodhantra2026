const { User } = require('../models');

// GET /api/profile
// Returns current user's profile
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error retrieving profile' });
    }
};

// PUT /api/profile
// Updates profile for 'member' or 'admin' only, limited fields for 'user'
// Actually, 'user' CAN edit non-fixed elements: college, branch, year, prn
// 'admin' can edit ALL elements: name, email, phone, college, branch, year, prn
// 'member' can edit: college, branch, year, prn
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, college, branch, year, prn } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Apply rules based on role
        if (user.role === 'admin') {
            if (name) user.name = name;
            if (email) user.email = email;
            if (phone !== undefined) user.phone = phone;
        }

        // All roles can edit these
        if (college !== undefined) user.college = college;
        if (branch !== undefined) user.branch = branch;
        if (year !== undefined) user.year = year;
        if (prn !== undefined) user.prn = prn;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                prn: user.prn,
                college: user.college,
                branch: user.branch,
                year: user.year,
                profile_picture: user.profile_picture,
                unique_id: user.unique_id
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// POST /api/profile/picture
// Upload profile picture. Admins and members only.
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }
        
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Rule: Only members and admins can upload pictures
        if (user.role === 'user') {
            return res.status(403).json({ message: 'Users cannot upload profile pictures' });
        }

        user.profile_picture = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({
            message: 'Profile picture updated successfully',
            profile_picture: user.profile_picture
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Server error uploading profile picture' });
    }
};

module.exports = {
    getMyProfile,
    updateProfile,
    uploadProfilePicture
};
