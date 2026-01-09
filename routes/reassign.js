import express from "express";
import Lead from "../models/Lead.js";
import File from "../models/File.js";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();

/**
 * @route   POST /api/reassign
 * @desc    Move all leads of a specific file from one agent to another
 * @access  Admin Only
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { fileId, oldUserId, newUserId } = req.body;

    // 1. Validation
    if (!fileId || !newUserId) {
      return res.status(400).json({ 
        message: "Missing required fields: fileId and newUserId are mandatory." 
      });
    }

    // 2. Update all leads linked to this File and User
    // We update 'assignedTo' to the new user
    const updateResult = await Lead.updateMany(
      { fileId: fileId, assignedTo: oldUserId },
      { $set: { assignedTo: newUserId } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ 
        message: "No leads found matching this File and User criteria." 
      });
    }

    // 3. Sync the File Model
    // Remove the old user from the file's assigned list and add the new one
    await File.findByIdAndUpdate(fileId, {
      $pull: { assignedTo: oldUserId },
    });
    
    await File.findByIdAndUpdate(fileId, {
      $addToSet: { assignedTo: newUserId },
    });

    res.json({
      success: true,
      message: `Successfully reassigned ${updateResult.modifiedCount} leads to the new user.`,
      count: updateResult.modifiedCount
    });

  } catch (err) {
    console.error("Reassign Error:", err);
    res.status(500).json({ message: "Internal Server Error during reassignment" });
  }
});

export default router;