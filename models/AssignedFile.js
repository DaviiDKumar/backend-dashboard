import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileName: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalLeads: Number,
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);
