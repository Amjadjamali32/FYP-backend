import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";

// Function to fetch an image from a remote URL as a buffer with error handling
async function fetchImageAsBuffer(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error("Error fetching image from URL:", error.message);
        if (error.response) {
            // If the error has a response, log status and data
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        } else if (error.request) {
            // If no response was received, log the request
            console.error("No response received, Request:", error.request);
        } else {
            // General error
            console.error("Error Details:", error.message);
        }
        throw new Error("Failed to fetch image from the provided URL.");
    }
}

export const generateReportPDF = async (reportData, signatureImageUrl, filePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Title
            doc.fontSize(18).text("Crime Report", { align: "center", underline: true });
            doc.moveDown();

            // Report details
            doc.fontSize(12)
                .text(`Case Number: ${reportData.caseNumber}`)
                .moveDown(0.5)
                .text(`Police Station: ${reportData.policeStationName || "N/A"}`) 
                .moveDown(0.5)
                .text(`Incident Type: ${reportData.incident_type}`)
                .moveDown(0.5)
                .text(`Location: ${reportData.location}`)
                .moveDown(0.5)
                .text(`Complainant Name: ${reportData.name}`)
                .moveDown(0.5)
                .text(`Complainant Email: ${reportData.email}`)
                .moveDown(0.5)
                .text(`Date: ${reportData.request_date}`)
                .moveDown(0.5)
                .text(`Time: ${reportData.request_time}`)
                .moveDown(0.5)
                .text(`Complainant NIC: ${reportData.nic}`)
                .moveDown(0.5)
                .text(`Description: ${reportData.incident_description}`)
                .moveDown(1);
            // Fetch signature image buffer from URL
            if (signatureImageUrl) {
                const imageBuffer = await fetchImageAsBuffer(signatureImageUrl);
                // console.log("Image fetched successfully.");
                
                // Add the fetched image to the PDF
                doc.text("Signature:", { align: "left" }).moveDown(0.5);
                doc.image(imageBuffer, {
                    fit: [150, 150],
                    align: "left",
                });
            }

            // End the document
            doc.end();

            // Resolve or reject on stream events
            stream.on("finish", () => resolve(filePath));
            stream.on("error", (err) => reject(err));
        } catch (error) {
            console.error("Error generating PDF:", error);
            reject("Error generating PDF.");
        }
    });
};