import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();

/**
 * Admin creates a normal user
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username: username.trim(),
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin: get all users
 */
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin: get all users with lead counts
 */
router.get("/with-leads", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      { role: "user" },
      { password: 0 }
    ).lean();

    const usersWithLeads = await Promise.all(
      users.map(async (user) => {
        const leadCount = await Lead.countDocuments({
          assignedTo: user._id,
        });
        return {
          ...user,
          leadCount,
        };
      })
    );

    res.json({ users: usersWithLeads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin: delete a user
 */
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin user" });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
