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

    const file = await File.create({
      fileName: req.file.originalname,
      uploadedBy: req.user.id,
      totalLeads: data.length,
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
          status: "none" // Default status for new leads
        });
      });
    });

    await Lead.insertMany(leads);

    res.json({ message: "File processed and leads distributed", totalLeads: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during upload" });
  }
});

/* ================= UPDATE LEAD STATUS (USER) ================= */
router.patch("/status/:leadId", auth, async (req, res) => {
  try {
    const { status } = req.body; // 'done', 'rejected', 'pending', or 'none'
    const validStatuses = ["done", "rejected", "pending", "none"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.leadId, assignedTo: req.user.id },
      { $set: { status: status } },
      { new: true }
    );

    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json({ message: "Status updated successfully", lead });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

/* ================= GET ALL MY PENDING LEADS (USER) ================= */
router.get("/my-pending", auth, async (req, res) => {
  try {
    const leads = await Lead.find({ 
      assignedTo: req.user.id, 
      status: "pending" 
    }).populate("fileId", "fileName");

    // Map to same format as LeadDetails for frontend consistency
    const formattedLeads = leads.map(lead => ({
      _id: lead._id,
      fileName: lead.fileId?.fileName || "Unknown File",
      full_name: lead.data["full name"] || lead.data["full_name"] || "N/A",
      email: lead.data["email"] || "N/A",
      phone_number: lead.data["phone number"] || lead.data["phone_number"] || "N/A",
      city: lead.data["city"] || "N/A",
      status: lead.status
    }));

    res.json({ leads: formattedLeads });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending leads" });
  }
});

/* ================= VIEW LEADS OF A FILE (USER) ================= */
router.get("/view/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const leads = await Lead.find({
      assignedTo: req.user.id,
      fileId: file._id,
    });

    const filteredLeads = leads.map(lead => ({
      _id: lead._id,
      full_name: lead.data["full name"] || lead.data["full_name"] || "N/A",
      email: lead.data["email"] || "N/A",
      phone_number: lead.data["phone number"] || lead.data["phone_number"] || "N/A",
      city: lead.data["city"] || "N/A",
      status: lead.status || "none", // Send status to frontend
    }));

    res.json({ 
      fileName: file.fileName,
      leads: filteredLeads 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LIST USER FILES (DASHBOARD) ================= */
router.get("/", auth, async (req, res) => {
  try {
    const files = await File.find({ assignedTo: req.user.id }).sort({ createdAt: -1 }).lean();

    const userFiles = await Promise.all(
      files.map(async (f) => {
        const countForThisUser = await Lead.countDocuments({
          fileId: f._id,
          assignedTo: req.user.id,
        });
        // Optional: Count how many are 'done' for progress bar
        const doneCount = await Lead.countDocuments({
          fileId: f._id,
          assignedTo: req.user.id,
          status: "done"
        });

        return {
          ...f,
          totalLeads: countForThisUser,
          completedLeads: doneCount
        };
      })
    );

    res.json({ files: userFiles });
  } catch (err) {
    res.status(500).json({ message: "Error fetching leads" });
  }
});

/* ================= DOWNLOAD & ADMIN ROUTES (REMAIN SAME) ================= */
router.get("/download/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.assignedTo.includes(req.user.id)) return res.status(403).json({ message: "Access denied" });
    const leads = await Lead.find({ assignedTo: req.user.id, fileId: file._id });
    const exportData = leads.map(l => l.data);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "MyLeads");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", `attachment; filename=Leads_${file.fileName}`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(buffer);
  } catch (err) { res.status(500).json({ message: "Download failed" }); }
});

router.get("/admin/all", auth, adminOnly, async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err) { res.status(500).json({ message: "Error fetching all files" }); }
});

export default router;