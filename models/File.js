import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true }, // original filename
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    totalLeads: { type: Number, required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);
