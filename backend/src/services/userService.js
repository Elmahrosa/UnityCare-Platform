// ✅ FIX: was importing 'bcryptjs' — unified to 'bcrypt' for consistency
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class UserService {
    static async registerUser({ name, email, password, role }) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // ✅ FIX: do NOT hash here — model pre-save hook handles it to avoid double-hashing
        const user = new User({ name, email, password, role: role || 'patient' });
        await user.save();
        return user;
    }

    static async loginUser(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        });

        return { user, token };
    }

    static async getUserById(userId) {
        const user = await User.findById(userId).select('-password -invalidatedTokens');
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    static async updateUser(userId, updateData) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // ✅ FIX: don't hash here — assign plain text and let pre-save hook hash it
        Object.assign(user, updateData);
        await user.save();
        return user;
    }
}

module.exports = UserService;