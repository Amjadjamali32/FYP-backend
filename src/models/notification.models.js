import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reports",
    required: false, 
  },
  caseNumber: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  severityLevel: {
    type: String,
    enum: ["Low", "Moderate", "High", "Critical"],
    default: "Low", 
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  receipientType: {
    type: String,
    enum: ["user", "admin", "both"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export const Notifications = mongoose.model("Notification", notificationSchema);