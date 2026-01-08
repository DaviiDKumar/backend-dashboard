import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", auth, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});

export default router;
