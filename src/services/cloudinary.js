import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import stream from "stream";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Determine the resource type based on file extension
const getResourceType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext))
    return "image";
  if ([".mp4", ".avi", ".mov", ".wmv", ".flv"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".aac", ".flac"].includes(ext)) return "video";
  if ([".pdf", ".doc", ".docx", ".txt"].includes(ext)) return "raw";
  throw new Error(`Unsupported file extension: ${ext}`);
};

export const uploadOnCloudinaryBuffer = async (buffer, originalname) => {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid buffer! Expected a Buffer instance");
    }

    const ext = path.extname(originalname || "file.jpg").toLowerCase();
    const resourceType = getResourceType(originalname);
    const baseName = path.parse(originalname).name;

    // ✅ Define options FIRST
    const uploadOptions = {
      resource_type: resourceType,
      folder: "media_uploads",
    };

    // ✅ Then modify them if it's a PDF
    if (ext === ".pdf") {
      uploadOptions.public_id = baseName;
      uploadOptions.format = "pdf";
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      const passthrough = new stream.PassThrough();
      passthrough.end(buffer);
      passthrough.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Error in uploadOnCloudinaryBuffer:", error);
    return null;
  }
};

// Delete a file from Cloudinary
export const deleteFromCloudinary = async (oldFilePublicId, resourceType = "raw") => {
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