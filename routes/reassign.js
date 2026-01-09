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
/* ================= REASSIGN SPECIFIC BATCH (ADMIN) ================= */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { fileId, oldUserId, newUserId } = req.body;

    // 1. Validation
    if (!fileId || !oldUserId || !newUserId) {
      return res.status(400).json({ 
        message: "Missing required fields: fileId, oldUserId, and newUserId are mandatory." 
      });
    }

    // 2. Update leads for THIS specific File AND THIS specific User only
    const updateResult = await Lead.updateMany(
      { fileId: fileId, assignedTo: oldUserId },
      { $set: { assignedTo: newUserId } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ 
        message: "No leads found for this caller in the selected batch." 
      });
    }

    // 3. Update the File Model tracking
    // We add the new user to the file's assigned list
    await File.findByIdAndUpdate(fileId, {
      $addToSet: { assignedTo: newUserId }
    });

    // Check if the old user still has ANY other leads in this file
    // (If not, we remove them from the File's assignedTo array)
    const remainingLeads = await Lead.countDocuments({ fileId: fileId, assignedTo: oldUserId });
    if (remainingLeads === 0) {
      await File.findByIdAndUpdate(fileId, {
        $pull: { assignedTo: oldUserId }
      });
    }

    res.json({
      success: true,
      message: `Successfully moved ${updateResult.modifiedCount} leads to the new agent.`,
    });

  } catch (err) {
    console.error("Reassign Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;