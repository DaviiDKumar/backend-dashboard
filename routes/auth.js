import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username, // ✅ include username
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

 res
  .cookie("token", token, {
    httpOnly: true,
    // Must be true for Cross-Site cookies to work
    secure: true, 
    // "none" is required when Frontend and Backend are on different domains
    sameSite: "none", 
    maxAge: 24 * 60 * 60 * 1000,
  })
  .json({
    role: user.role,
    username: user.username,
  });
});

router.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Clears the cookie immediately
      secure: true,      
      sameSite: "none",     // MUST match the login route to be accepted
    })
    .json({ message: "Logged out successfully" });
});

export default router;
