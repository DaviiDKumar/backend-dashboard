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
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // ✅ NO COOKIES: Send token in the JSON body
  // This is the "Bearer Token" method that works on Safari
  res.json({
    token, 
    role: user.role,
    username: user.username,
  });
});

// Logout is now handled mostly on the frontend by clearing localStorage
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful. Please clear token from client storage." });
});

export default router;