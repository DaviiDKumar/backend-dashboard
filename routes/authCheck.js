import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/check", auth, (req, res) => {
  // only send role if auth middleware passes
  res.json({ role: req.user.role });
});

export default router;
