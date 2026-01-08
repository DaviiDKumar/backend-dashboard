import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import File from "../models/File.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ================= UPLOAD & SPLIT (ADMIN) ================= */
router.post("/upload", auth, adminOnly, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) return res.status(400).json({ message: "Empty Excel file" });

    const users = await User.find({ role: "user" });
    if (!users.length) return res.status(400).json({ message: "No users found" });

    // Create the master file record
    const file = await File.create({
      fileName: req.file.originalname,
      uploadedBy: req.user.id,
      totalLeads: data.length, // Total leads in the entire sheet
      assignedTo: users.map(u => u._id),
    });

    const chunkSize = Math.ceil(data.length / users.length);
    const leads = [];

    users.forEach((user, index) => {
      const slice = data.slice(index * chunkSize, (index + 1) * chunkSize);
      slice.forEach(leadData => {
        leads.push({
          data: leadData,
          assignedTo: user._id,
          uploadedBy: req.user.id,
          fileId: file._id,
        });
      });
    });

    await Lead.insertMany(leads);

    res.json({
      message: "File processed and leads distributed",
      totalLeads: data.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during upload" });
  }
});

/* ================= LIST USER FILES (FIXED) ================= */
router.get("/", auth, async (req, res) => {
  try {
    // 1. Get files assigned to this user
    const files = await File.find({ assignedTo: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Map through files and count only leads assigned to THIS user
    const userFiles = await Promise.all(
      files.map(async (f) => {
        const countForThisUser = await Lead.countDocuments({
          fileId: f._id,
          assignedTo: req.user.id,
        });
        return {
          ...f,
          totalLeads: countForThisUser, // Override global count with user-specific count
        };
      })
    );

    res.json({ files: userFiles });
  } catch (err) {
    res.status(500).json({ message: "Error fetching leads" });
  }
});

/* ================= DOWNLOAD (USER) ================= */
router.get("/download/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const leads = await Lead.find({
      assignedTo: req.user.id,
      fileId: file._id,
    });

    const exportData = leads.map(l => l.data);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "MyLeads");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename=Leads_${file.fileName}`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: "Download failed" });
  }
});

export default router;