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

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,      // Required for HTTPS (Render)
      sameSite: "none",  // Required for cross-domain (Vercel to Render)
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",         // ✅ Added: Ensures cookie is valid for all pages
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
      secure: true,      // Must match login
      sameSite: "none",  // Must match login
      expires: new Date(0),
      path: "/",         // ✅ Added: Ensures deletion applies to the whole site
    })
    .json({ message: "Logged out successfully" });
});

export default router;