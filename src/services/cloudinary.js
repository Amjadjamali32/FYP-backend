import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Determine the resource type based on file extension
const getResourceType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) {
        return "image";
    } else if ([".mp4", ".avi", ".mov", ".wmv", ".flv"].includes(ext)) {
        return "video";
    } else if ([".mp3", ".wav", ".aac", ".flac"].includes(ext)) {
        return "video";
    } else if ([".pdf", ".doc", ".docx", ".txt"].includes(ext)) {
        return "raw"; // Documents are stored as "raw" in Cloudinary
    } else {
        throw new Error(`Unsupported file type: ${ext}`);
    }
};

// Check if the file extension is allowed
const isSupportedFileType = (filePath) => {
    const allowedExtensions = [
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", // Images
        ".mp4", ".avi", ".mov", ".wmv", ".flv",           // Videos
        ".mp3", ".wav", ".aac", ".flac",                  // Audio
        ".pdf", ".doc", ".docx", ".txt"                   // Documents
    ];
    return allowedExtensions.includes(path.extname(filePath).toLowerCase());
};

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        if (!fs.existsSync(localFilePath)) {
            console.error("File does not exist:", localFilePath);
            return null;
        }

        if (!isSupportedFileType(localFilePath)) {
            console.error("Unsupported file type:", localFilePath);
            fs.unlinkSync(localFilePath); // Delete unsupported file
            return null;
        }

        const resourceType = getResourceType(localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            folder: "media_uploads",
        });

        fs.unlinkSync(localFilePath); // Delete local file after successful upload
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Delete a file from Cloudinary
const deleteFromCloudinary = async (oldFilePublicId, resourceType = "raw") => {
    try {
        const result = await cloudinary.uploader.destroy(oldFilePublicId, {
            resource_type: resourceType, 
        });
        return result;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw error;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
