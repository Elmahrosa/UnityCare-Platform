// ✅ FIX: was importing 'bcryptjs' while all other files use 'bcrypt'
// Unified to 'bcrypt' to avoid subtle comparison failures if both are installed
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '1h') => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

class AuthService {
    static async loginUser(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            // ✅ FIX: generic message prevents user enumeration
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = generateToken(user._id);
        return { user: this.sanitizeUser(user), token };
    }

    static async refreshToken(token) {
        if (!token) {
            throw new Error('No token provided');
        }

        try {
            const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
            const decoded = jwt.verify(token, refreshSecret);
            const user = await User.findById(decoded.id).select('-password -invalidatedTokens');

            if (!user) {
                throw new Error('User not found');
            }

            const newToken = generateToken(user._id);
            return { user: this.sanitizeUser(user), token: newToken };
        } catch (err) {
            throw new Error('Invalid token');
        }
    }

    static sanitizeUser(user) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // ✅ ADDED: role is needed by frontend for RBAC routing
        };
    }
}

module.exports = AuthService;