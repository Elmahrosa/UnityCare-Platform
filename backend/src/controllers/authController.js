const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// ✅ Helper: generate access + refresh tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

// Login a user
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        // ✅ FIX: generic message prevents user enumeration
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);

        res.json({
            token: accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Refresh token
exports.refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ msg: 'No token provided' });
    }

    try {
        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
        const decoded = jwt.verify(token, refreshSecret);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // ✅ FIX: was re-verifying with same secret as access token — broken rotation
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        res.json({
            token: accessToken,
            refreshToken: newRefreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(401).json({ msg: 'Invalid or expired refresh token' });
    }
};

// ✅ FIX: Logout now actually invalidates the token via blacklist
exports.logoutUser = async (req, res) => {
    try {
        const token = req.token; // Set by authMiddleware
        if (token) {
            await User.findByIdAndUpdate(req.user._id, {
                $push: { invalidatedTokens: token }
            });
        }
        res.json({ msg: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error during logout' });
    }
};