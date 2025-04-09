import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["image", "video", "audio", "document", "raw"],
        required: true,
    },
    evidencefileUrl: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    caseNumber: {
        type: String,
        required: true,
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
        required: true,
    },
}, { timestamps: true });

export const Evidence = mongoose.model("Evidence", evidenceSchema);
