import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { ApiError } from '../Utils/ApiErrorResponse.js';

export const NICVerificationService = {
    async verifyNIC(nicNumber, imagePath) {
        try {
            console.log("Starting NIC verification...");
            // console.log("Original File Path:", imagePath);

            // Step 1: Preprocess the image (Enhance and convert it)
            const processedImageBuffer = await sharp(imagePath)
              .resize(800) // Resize to 800px width
              .toBuffer(); // Get the processed image buffer

            // Step 2: Perform OCR on the enhanced image
            const { data: { text } } = await Tesseract.recognize(processedImageBuffer, 'eng', {
                logger: (m) => console.log(m),
            });
  
            // Step 3: Extract NIC number from OCR text
            const extractedNICNumber = this.extractNICNumber(text);
            console.log("Extracted NIC Number:", extractedNICNumber);

            if (extractedNICNumber !== nicNumber) {
               return ApiError(res, 402, "NIC Verification failed: Mismatch between extracted and provided NIC number!");
            }

            return true;
        } catch (error) {
            console.error("Error in NIC verification process:", error);
            return ApiError(res, 400, "NIC Verification failed!");
        } 
    },

    extractNICNumber(text) {
        const regex = /\d{5}-\d{7}-\d{1}/; // NIC number format
        const match = text.match(regex);
        return match ? match[0] : null;
    },
};
