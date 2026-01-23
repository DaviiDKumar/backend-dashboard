import express from "express";
import XLSX from "xlsx"; // <--- ADD THIS IMPORT
import Lead from "../models/Lead.js";
import ForwardedLead from "../models/ForwardedLead.js";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();

/* 1. USER ACTION: MOVE TO ARCHIVE (FORWARD) */
router.post("/forward-to-admin", auth, async (req, res) => {
    try {
        const { leadIds } = req.body;

        // Find the original leads and populate file details if necessary
        const leadsToForward = await Lead.find({ _id: { $in: leadIds }, assignedTo: req.user.id })
                                         .populate("fileId");

        if (leadsToForward.length === 0) return res.status(404).json({ msg: "No leads found" });

        // Prepare data for the new collection
        const archiveData = leadsToForward.map(l => ({
            originalLeadId: l._id,
            data: l.data,
            // Use the fileName from the populated file model, or fallback
            sourceFile: l.fileId?.fileName || "Unknown Batch",
            fromUser: req.user.id
        }));

        await ForwardedLead.insertMany(archiveData);
        await Lead.deleteMany({ _id: { $in: leadIds } });

        res.json({ success: true, count: archiveData.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Migration failed" });
    }
});

/* 2. ADMIN ACTION: FETCH ALL FORWARDED LEADS */
router.get("/admin/all-forwarded", auth, adminOnly, async (req, res) => {
    try {
        const leads = await ForwardedLead.find()
            .populate("fromUser", "username email")
            .sort({ forwardedAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

/* ================= DOWNLOAD ALL AS EXCEL ================= */
router.get("/admin/download-all", auth, adminOnly, async (req, res) => {
    try {
        const leads = await ForwardedLead.find().populate("fromUser", "username email");
        
        if (!leads || leads.length === 0) {
            return res.status(400).json({ message: "No data to export" });
        }

        // Standardizing the Excel row structure
        const exportData = leads.map(l => ({
            ...l.data, // Spreads original Excel columns (Name, Phone, etc.)
            AGENT_NAME: l.fromUser?.username || "N/A",
            AGENT_EMAIL: l.fromUser?.email || "N/A",
            SOURCE_BATCH: l.sourceFile,
            ARCHIVED_ON: new Date(l.forwardedAt).toLocaleString()
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Master_Archive");
        
        // Generate buffer
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Disposition", "attachment; filename=Master_Logs_Export.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (err) {
        console.error("Excel Export Error:", err);
        res.status(500).json({ message: "Internal Server Error during export" });
    }
});

/* ================= MANUAL PURGE (DELETE ALL) ================= */
router.delete("/admin/purge-all", auth, adminOnly, async (req, res) => {
    try {
        await ForwardedLead.deleteMany({});
        res.json({ success: true, message: "Archive cleared successfully" });
    } catch (err) {
        res.status(500).json({ error: "Purge failed" });
    }
});

export default router;