import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const reportsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    complainant_name: {
        type: String,
        required: true,
        trim: true,
    },
    complainant_email: {
        type: String,
        required: true,
        trim: true,
    },
    nic: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    caseNumber: {
        type: String,
        required: true,
        index: true,
    },
    reportPdfUrl: {
        required: true,
        type: String,
    },
    incident_type: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
        trim: true,
    },
    location: {  
        type: String,
        required: true,
        trimed: true,
    },
    userLocation: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
    },
    incident_description: {
        type: String,
        required: true,
    },
    reportStatus: {
        type: String,
        enum: ["pending", "investigating", "rejected", "resolved", "closed"],
        required: true,
    },
    reportedDate: {
        type: Date,
        required: true,
    },
    signatureImageUrl: {
        type: String,
        required: true,
    },
    policeStationName: {
        type: String,
        required: true,
    },
    evidences: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence'
    }],
    deletedByUser: { 
        type: Boolean, 
        default: false 
    },
    reportedTime: {
        type: String,
        required: true,
    }
}, { timestamps: true });

// Middleware to generate unique case number before saving
reportsSchema.pre('save', function (next) {
    if (!this.caseNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.caseNumber = `CASE-${year}${month}${day}-${uuidv4().slice(0, 8)}`;  // Unique case number
    }
    next();
});

export const Reports = mongoose.model("Reports", reportsSchema);
