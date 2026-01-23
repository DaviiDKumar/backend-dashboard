import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();

// HELPER: Industry Standard Email Regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin creates a normal user (Agent Node)
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1. Basic Field Presence
    if (!email || !password || !username) {
      return res.status(400).json({ message: "Email, username and password are required" });
    }

    // 2. Regex & Sanitization
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Invalid email architecture detected" });
    }

    if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    // 3. Duplicate Checks
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: "Identity conflict: Email already registered" });
    }

    const usernameExists = await User.findOne({ username: username.trim().toLowerCase() });
    if (usernameExists) {
      return res.status(400).json({ message: "Identity conflict: Username already active" });
    }

    // 4. Hashing & Creation
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "Agent provisioned successfully",
      user: { id: user._id, email: user.email, username: user.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Grid Provisioning Error" });
  }
});

/**
 * Admin: get all users with lead counts
 */
router.get("/with-leads", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }, { password: 0 }).lean();

    const usersWithLeads = await Promise.all(
      users.map(async (user) => {
        const leadCount = await Lead.countDocuments({ assignedTo: user._id });
        return { ...user, leadCount };
      })
    );

    res.json({ users: usersWithLeads });
  } catch (err) {
    res.status(500).json({ message: "Data retrieval error" });
  }
});

/**
 * Admin: delete a user
 */
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Cannot delete admin node" });

    await User.findByIdAndDelete(id);
    res.json({ message: "Node access revoked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Revocation error" });
  }
});

/**
 * Admin: Rotate Keys (Reset Password)
 */
router.post("/reset-password", auth, adminOnly, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    // Security Check: Password Complexity (Regex can be added here too)
    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Key rotation requires min 6 character length." 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { _id: userId }, 
      { password: hashedPassword },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Agent node not found." });

    res.json({ 
      success: true, 
      message: `Access keys for ${user.username} rotated.` 
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Security Breach" });
  }
});

export default router;