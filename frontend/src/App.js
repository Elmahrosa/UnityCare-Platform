const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const tokenBlacklist = new Set();
exports.tokenBlacklist = tokenBlacklist;

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

exports.registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
];

exports.loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "patient",
    });

    const accessToken = signAccess({ id: user._id, role: user.role });
    const refreshToken = signRefresh({ id: user._id });

    return res.status(201).json({
      token: accessToken,
      refreshToken,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("[register]", error.message);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const accessToken = signAccess({ id: user._id, role: user.role });
    const refreshToken = signRefresh({ id: user._id });

    return res.json({
      token: accessToken,
      refreshToken,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("[login]", error.message);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ msg: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    const newAccessToken = signAccess({ id: user._id, role: user.role });
    const newRefreshToken = signRefresh({ id: user._id });

    return res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: safeUser(user),
    });
  } catch (error) {
    return res.status(401).json({ msg: "Invalid or expired refresh token" });
  }
};

exports.logout = (req, res) => {
  if (req.token) {
    tokenBlacklist.add(req.token);
    const ttl = parseInt(process.env.JWT_TTL_SECONDS || "3600", 10);
    setTimeout(() => tokenBlacklist.delete(req.token), ttl * 1000);
  }

  return res.json({ msg: "Logged out successfully" });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json(safeUser(user));
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
};
