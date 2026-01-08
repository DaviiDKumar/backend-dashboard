import express from "express";
import { auth } from "../middleware/auth.js"; // This is your updated Header-based middleware

const router = express.Router();

/**
 * @route   GET /api/auth/check
 * @desc    Verify the JWT token from the Authorization header
 * @access  Private
 */
router.get("/check", auth, (req, res) => {
  // If the 'auth' middleware passes, req.user contains the decoded token data
  // We send back the role and username to the frontend
  res.status(200).json({ 
    authenticated: true,
    role: req.user.role, 
    username: req.user.username 
  });
});

export default router;