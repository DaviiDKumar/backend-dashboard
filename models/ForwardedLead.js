import mongoose from "mongoose";

const forwardedLeadSchema = new mongoose.Schema({
    originalLeadId: mongoose.Schema.Types.ObjectId,
    data: { type: Object, required: true },
    sourceFile: String,
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    forwardedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("ForwardedLead", forwardedLeadSchema);