import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    data: { type: Object, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    status: { 
      type: String, 
      // FIX: Added "flushed" to the allowed list below
      enum: ["pending", "done", "rejected", "none", "flushed"], 
      default: "none" 
    },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);