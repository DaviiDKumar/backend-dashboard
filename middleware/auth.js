import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  // ✅ 1. Check for the Authorization header instead of cookies
  const authHeader = req.headers.authorization;
  
  // ✅ 2. Extract the token (it usually looks like "Bearer <token_string>")
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided, access denied" });
  }

  try {
    // 3. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach user data to the request object
    req.user = decoded; 
    
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}