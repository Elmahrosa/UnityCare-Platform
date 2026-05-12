const express = require('express');
const { check } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    ],
    userController.registerUser
);

// @route   POST api/users/login
// @desc    Login a user
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    userController.loginUser
);

// @route   GET api/users/me
// @desc    Get current user details
// @access  Private
// ✅ FIX: was referencing 'getUser Details' (space) — broken route handler reference
router.get('/me', authMiddleware, userController.getUserDetails);

// @route   PUT api/users/update
// @desc    Update user information
// @access  Private
router.put(
    '/update',
    authMiddleware,
    [
        check('name', 'Name is required').optional().not().isEmpty(),
        check('email', 'Please include a valid email').optional().isEmail(),
        check('password', 'Password must be at least 8 characters').optional().isLength({ min: 8 }),
    ],
    userController.updateUser
);

// @route   GET api/users
// @desc    List all users (admin only)
// @access  Private/Admin
router.get(
    '/',
    authMiddleware,
    authMiddleware.requireRole('admin'),
    userController.getAllUsers
);

module.exports = router;