import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

export const Location = mongoose.model("Location", locationSchema);
