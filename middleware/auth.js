import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  // ✅ Check if token is missing OR is the literal string "undefined"
  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    // ✅ If the token is expired, send a 401 so the frontend clears localStorage
    res.status(401).json({ message: "Invalid or expired token" });
  }
};