import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const token = req.cookies?.token; // read cookie
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
