const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
  if (!token) return res.status(401).json({ error: "Bearer token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role_id];
  if (!allowedRoles.some((role) => roles.includes(role))) {
    return res.status(403).json({ error: "Forbidden: insufficient permissions" });
  }
  return next();
};

module.exports = {
  authenticateToken,
  requireRole
};
