import PDFDocument from "pdfkit";
import axios from "axios";

// Fetch an image from a remote URL as a buffer
async function fetchImageAsBuffer(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    console.error("Error fetching image from URL:", error.message);
    throw new Error("Failed to fetch image from the provided URL.");
  }
}

// Generate PDF and return as buffer (in memory)
export const generateReportPDFBuffer = async (reportData, signatureImageUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

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

      // Add signature image if available
      if (signatureImageUrl) {
        const imageBuffer = await fetchImageAsBuffer(signatureImageUrl);
        doc.text("Signature:", { align: "left" }).moveDown(0.5);
        doc.image(imageBuffer, {
          fit: [150, 150],
          align: "left",
        });
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error("Error generating PDF buffer:", error);
      reject(error);
    }
  });
};