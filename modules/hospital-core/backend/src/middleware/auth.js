const { verifyAccess } = require("../services/jwt");

function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  try {
    req.user = verifyAccess(token);
    return next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}

module.exports = auth;
