import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// HELPER: EMAIL REGEX
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    // 1. DATA VALIDATION
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // 2. REGEX VALIDATION
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email architecture" });
    }

    // 3. NORMALIZATION & FIND USER
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // 4. CREDENTIAL VERIFICATION
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Use generic message to prevent user enumeration
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5. GENERATE JWT TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 6. SUCCESS RESPONSE
    res.status(200).json({
      token: token,
      role: user.role,
      username: user.username
    });

  } catch (error) {
    console.error("Auth_Error:", error);
    res.status(500).json({ message: "Server protocol error" });
  }
});

export default router;