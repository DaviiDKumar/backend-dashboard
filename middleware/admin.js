export function adminOnly(req, res, next) {
  // ✅ Safety check: ensure user exists before checking role
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ 
      message: "Access denied. Admin privileges required." 
    });
  }
  next();
}