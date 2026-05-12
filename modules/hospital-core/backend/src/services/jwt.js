const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function signAccess(payload) {
  if (!ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }

  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

function signRefresh(payload) {
  if (!REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }

  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

function verifyAccess(token) {
  if (!ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }

  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  if (!REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }

  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
};
