const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ FIX: authMiddleware was exported as a plain function.
// blockchainRoutes.js called authMiddleware.verifyToken — this would fail.
// Now we export both the default middleware AND a named verifyToken alias.

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -invalidatedTokens');

        if (!user) {
            return res.status(401).json({ msg: 'User no longer exists' });
        }

        // ✅ ADDED: check token blacklist (supports logout invalidation)
        if (user.invalidatedTokens && user.invalidatedTokens.includes(token)) {
            return res.status(401).json({ msg: 'Token has been invalidated. Please log in again.' });
        }

        req.user = user;
        req.token = token; // Store token for logout blacklisting
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

// ✅ ADDED: Role-based access control guard
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ msg: `Access denied. Required roles: ${roles.join(', ')}` });
    }
    next();
};

// ✅ FIX: expose verifyToken alias so blockchainRoutes.js works without changes
authMiddleware.verifyToken = authMiddleware;
authMiddleware.requireRole = requireRole;

module.exports = authMiddleware;