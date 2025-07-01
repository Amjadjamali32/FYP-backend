import { Reports } from "../models/report.model.js";
import { Evidence } from "../models/evidence.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../Utils/ApiSuccessResponse.js";
import { ApiError } from "../Utils/ApiErrorResponse.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { Location } from "../models/location.models.js";
import axios from "axios";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.js";
import {
  sendCrimeReportConfirmationEmail,
  sendUpdatedCrimeReportEmail,
} from "../services/emailServices.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { generateReportPDF } from "../Utils/pdfGenerator.js";
import { fileURLToPath } from "url";
import {
  crimeReportStatusTemplate,
  deleteComplaintTemplate,
  newComplaintTemplate,
  deleteAllComplaintTemplate,
  deleteSingleReportByAdminNotificationTemplate,
  deleteAllReportsByAdminNotificationTemplate,
  updatedReportByAdminNotificationTemplate,
  addedNewReportByAdminNotificationTemplate,
} from "../Utils/notificationTemplates.js";
import { sendNotifications } from "../Utils/sendNotifications.js";
import { crimeSeverity, defaultSeverity } from "../config/severityLevel.js";
import getAdminTokens from "../Utils/getAdminTokens.js";

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Controller for creating reports
const createUserReport = asyncHandler(async (req, res) => {
  try {
    const { prompt, latitude, longitude } = req.body;
    const signatureImage = req.files?.signatureImage?.[0]?.path;
    const evidenceFiles = req.files?.evidenceFiles || []; // Default to empty array if no files
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    // Input validation (unchanged)
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return ApiError(
        res,
        400,
        "Prompt is required and must be a non-empty string!"
      );
    }

    if (!signatureImage) {
      return ApiError(res, 400, "Signature image is required!");
    }

    if (
      isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return ApiError(res, 400, "Invalid location coordinates!");
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return ApiError(res, 404, "User not found!");
    }

    let username = user.fullname;
    let email = user.email;
    let nic = user.NICNumber;

    // Step 1: Generate the report using AI API (unchanged)
    const aiPayload = {
      complainant_name: username,
      complainant_email: email,
      complainant_nic: nic,
      incident_description: prompt,
    };

    const aiResponse = await axios.post(process.env.AI_SERVICE_URL, aiPayload);

    if (!aiResponse.data) {
      return ApiError(res, 500, "Error generating report!");
    }

    // Step 2: Sanitize the incident_type (unchanged)
    const sanitizeString = (str) => {
      return str.replace(/[^a-zA-Z\s]/g, ""); // Remove all non-alphabetic characters and numbers
    };

    const sanitizedIncidentType = sanitizeString(
      aiResponse.data.incident_type.toLowerCase()
    );

    // Step 3: Map crime type to severity level (unchanged)
    const crimeType = sanitizedIncidentType;
    const severity = crimeSeverity[crimeType] || defaultSeverity;

    // Step 4: Upload signature image to Cloudinary (unchanged)
    const uploadedSignatureImage = await uploadOnCloudinary(signatureImage);

    if (!uploadedSignatureImage) {
      return ApiError(res, 500, "Error uploading signature image!");
    }

    // Step 5: Save user location (unchanged)
    const userLocation = await Location.create({
      userId,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    });

    if (!userLocation) {
      return ApiError(res, 500, "Error saving user location!");
    }

    // Step 6: Create the report (unchanged)
    const report = await Reports.create({
      userId,
      incident_description: aiResponse.data.incident_description,
      incident_type: sanitizedIncidentType,
      location: aiResponse.data.location,
      reportStatus: "pending",
      reportedDate: new Date(),
      signatureImageUrl: uploadedSignatureImage.url,
      policeStationName: "A Section",
      userLocation: userLocation._id,
      caseNumber: uuidv4(),
      reportedTime: new Date().toLocaleTimeString(),
      complainant_name: username,
      complainant_email: email,
      nic: nic,
      reportPdfUrl: "initial url",
    });

    if (!report) {
      return ApiError(res, 500, "Error creating report!");
    }

    // Step 7: Upload and save evidence files (only if evidenceFiles is not empty)
    if (evidenceFiles.length > 0) {
      const evidenceDocs = await Promise.all(
        evidenceFiles.map(async (file) => {
          try {
            const uploadedFile = await uploadOnCloudinary(file.path);
            if (uploadedFile) {
              const evidence = new Evidence({
                type: uploadedFile.resource_type,
                evidencefileUrl: uploadedFile.url,
                userId: user._id,
                reportId: report._id,
                caseNumber: report.caseNumber,
              });
              return await evidence.save(); // Save to DB
            }
          } catch (err) {
            console.error("Error uploading evidence file:", err);
            return null; // Handle individual file failures gracefully
          }
        })
      );

      // Filter out any failed uploads
      const validEvidenceDocs = evidenceDocs.filter(
        (evidence) => evidence !== null
      );
      if (validEvidenceDocs.length > 0) {
        report.evidences.push(
          ...validEvidenceDocs.map((evidence) => evidence._id)
        );
        await report.save();
      }
    }

    const tempDir = path.join(__dirname, "../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Step 8: Generate and upload the PDF (unchanged)
    // const pdfFilePath = path.join(
    //   __dirname,
    //   "../../public/temp/",
    //   `Crime_Report${report.caseNumber}.pdf`
    // );

    const pdfFilePath = path.join(tempDir, `Crime_Report${report.caseNumber}.pdf`);
    const signatureImageURL = uploadedSignatureImage.url;
    
    await generateReportPDF(
    { ...aiResponse.data, caseNumber: report.caseNumber, policeStationName: report.policeStationName },
    signatureImageURL,
    pdfFilePath
    );

    const uploadedPDF = await uploadOnCloudinary(pdfFilePath);

    if (!uploadedPDF) {
      return ApiError(res, 500, "Error uploading report PDF!");
    }

    report.signatureImageUrl = signatureImageURL;
    report.reportPdfUrl = uploadedPDF.url;
    await report.save();

    // Step 9: Send notifications (unchanged)
    const adminTokens = await getAdminTokens();
    const { title, body } = newComplaintTemplate(
      report.caseNumber,
      report.status
    );
    const userToken = user.fcmToken;
    const data = {
      caseNumber: report.caseNumber,
      severity,
      reportId: report._id,
    };

    await sendNotifications(
      user._id,
      userToken,
      adminTokens,
      title,
      body,
      data,
      severity,
      "both"
    );

    // Step 10: Send confirmation email (unchanged)
    await sendCrimeReportConfirmationEmail(username, email, report.caseNumber);
    return res
      .status(200)
      .json(new ApiResponse(200, report, "Report created successfully"));
  } catch (error) {
    console.error("Error creating report:", error);
    return ApiError(res, 500, "Error creating report");
  }
});

// Get all reports for a user
const getAllUserReports = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { page = 1, limit = 10, crimeNumber } = req.query;

  // Ensure userId is dynamically passed from the request
  const query = { userId, deletedByUser: false };

  if (crimeNumber) {
    query.caseNumber = crimeNumber;
  }

  try {
    // Fetch reports with pagination
    const reports = await Reports.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "fullname email NICNumber")
      .select("-userLocation -evidences");

    // Count total reports matching the query
    const totalReports = await Reports.countDocuments(query);

    // console.log("Reports:", reports);
    // console.log("Total Reports:", totalReports);

    if (reports.length === 0) {
      return ApiError(res, 200, "No reports found", {
        totalReports,
        reports: [],
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalReports,
          reports,
          currentPage: page,
          totalPages: Math.ceil(totalReports / limit),
        },
        "User reports retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving reports:", error);
    return ApiError(res, 500, error.message);
  }
});

// Get a single report for a user
const getSingleUserReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const reportId = req.params.id;

  // Include deleteByUser condition to exclude deleted reports
  const report = await Reports.findOne({
    userId: userId,
    _id: reportId,
    deletedByUser: false,
  })
    .populate("userId", "fullname email NICNumber")
    .select("-evidences -userLocation");

  if (!report) return ApiError(res, 404, "Report not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Report retrieved successfully"));
});

// delete a report
const deleteUserReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const reportId = req.params.id;

  // Fetch the report before updating
  const report = await Reports.findOne({ userId, _id: reportId });

  console.log("Report:", report);

  if (!report) {
    return ApiError(res, 404, "Report not found!");
  }

  // Store the caseNumber before updating
  const caseNumber = report.caseNumber;

  // Mark the report as deleted
  await Reports.updateOne(
    { userId, _id: reportId },
    { $set: { deletedByUser: true } }
  );

  // console.log("Report deleted:", report);

  // Send notifications
  const { title, body } = deleteComplaintTemplate(caseNumber);
  const userToken = req.user.fcmToken;
  const data = { caseNumber, reportId };
  await sendNotifications(userId, userToken, [], title, body, data, "user");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Report deleted successfully"));
});

// delete all reports
const deleteAllUserReports = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("User ID:", userId);

    // Fetch user details to get the name
    let user;
    try {
      user = await User.findById(userId).select("fullname");
      if (!user) {
        return ApiError(res, 404, "User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return ApiError(res, 500, "Error retrieving user data");
    }

    // Fetch all reports before marking them as deleted
    let reports;
    try {
      reports = await Reports.find({ userId, deletedByUser: false });
      if (reports.length === 0) {
        return ApiError(res, 400, "No reports found to delete!");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      return ApiError(res, 500, "Error retrieving reports");
    }

    // Mark all reports as deleted
    try {
      const deletedReports = await Reports.updateMany(
        { userId, deletedByUser: false },
        { $set: { deletedByUser: true } }
      );

      if (deletedReports.modifiedCount === 0) {
        return ApiError(res, 500, "Error deleting reports!");
      }

      console.log("Deleted reports: ", deletedReports);
    } catch (error) {
      console.error("Error updating reports:", error);
      return ApiError(res, 500, "Error marking reports as deleted");
    }

    // Send notifications
    try {
      const userToken = req.user.fcmToken;
      for (const report of reports) {
        const { title, body } = deleteAllComplaintTemplate(user.fullname);
        const data = {
          caseNumber: report.caseNumber,
          reportId: report._id,
          userName: user.fullname,
        };
        await sendNotifications(
          userId,
          userToken,
          [],
          title,
          body,
          data,
          "user"
        );
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      return ApiError(res, 500, "Error sending notifications");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "All reports deleted successfully"));
  } catch (error) {
    console.error("Unexpected error:", error);
    return ApiError(res, 500, "Internal server error");
  }
});

// Get a report status
const checkStatus = asyncHandler(async (req, res) => {
  const { caseNumber, userId } = req.body;

  if (!caseNumber) {
    return ApiError(res, 400, "Case number is required!");
  }

  try {
    const report = await Reports.findOne({
      caseNumber: caseNumber.trim(),
      userId: userId,
      deletedByUser: false,
    }).select(
      "reportStatus reportedDate incident_type caseNumber policeStationName"
    );

    // console.log("Query Parameters:", { caseNumber: caseNumber.trim(), deletedByUser: false });

    // console.log("report from status: ", report);

    if (!report || report.length === 0) {
      return ApiError(res, 404, "Report not found!");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, report, "Report status retrieved successfully")
      );
  } catch (error) {
    console.error("Error retrieving report status:", error);
    return ApiError(res, 500, "Internal server error!");
  }
});

// Admin controllers (notifications are remaining to set up)
// Get all reports for admin (including deleted ones)
const getAllAdminReports = asyncHandler(async (req, res) => {
  try {
    const { caseNumber } = req.query; // Extract caseNumber from query parameters

    let query = {}; // Default query is an empty object to fetch all reports

    // If caseNumber is provided, add it to the query
    if (caseNumber) {
      query.caseNumber = caseNumber; // Add caseNumber condition to the query
    }

    const reports = await Reports.find(query);

    if (!reports || reports.length === 0) {
      return ApiError(res, 404, "No reports found!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, reports, "Reports retrieved successfully"));
  } catch (error) {
    return ApiError(res, 500, "Internal server error!");
  }
});

// Get a single report for admin (including deleted ones)
const getSingleAdminReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Find the report by ID and populate user details
    const report = await Reports.findById(id).populate(
      "userId",
      "fullname email NICNumber"
    ); // Populate user details

    if (!report) {
      return ApiError(res, 404, "Report not found!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Report retrieved successfully"));
  } catch (error) {
    return ApiError(res, 500, "Internal server error!");
  }
});

// Delete a report for admin (hard-delete)
const deleteAdminReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Reports.findById(id);

    if (!report) {
      return ApiError(res, 404, "Report not found!");
    }

    const { caseNumber, userId } = report;

    const deletedReport = await Reports.findByIdAndDelete(id);

    if (!deletedReport) {
      return ApiError(res, 404, "Report not found!");
    }

    // Send notifications
    const { title, body } =
      deleteSingleReportByAdminNotificationTemplate(caseNumber);
    const userToken = req.user.fcmToken;
    const data = { caseNumber, reportId: id };
    const adminTokens = getAdminTokens();
    await sendNotifications(
      userId,
      userToken,
      adminTokens,
      title,
      body,
      data,
      "admin"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Report deleted successfully"));
  } catch (error) {
    return ApiError(res, 500, "Internal Server Error!");
  }
});

// Delete all reports for admin (hard-delete)
const deleteAllAdminReports = asyncHandler(async (req, res) => {
  try {
    // Fetch all reports
    const reports = await Reports.find();

    if (reports.length === 0) {
      return ApiError(res, 404, "No reports found to delete!");
    }

    // Collect user IDs and case numbers for notifications
    const notifications = reports.map((report) => ({
      userId: report.userId,
      caseNumber: report.caseNumber,
      reportId: report._id,
    }));

    // Delete all reports
    const deleteResult = await Reports.deleteMany({});

    if (deleteResult.deletedCount === 0) {
      return ApiError(res, 404, "No reports were deleted!");
    }

    // Send notifications to users and admins
    const adminTokens = getAdminTokens(); // Get FCM tokens of all admins

    for (const notification of notifications) {
      const { userId, caseNumber, reportId } = notification;

      // Fetch the user's FCM token
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        console.warn(`User ${userId} not found or FCM token missing`);
        continue;
      }

      const userToken = user.fcmToken;

      // Prepare notification data
      const { title, body } = deleteAllReportsByAdminNotificationTemplate();
      const data = { caseNumber, reportId };

      // Send notification to the user and admins
      await sendNotifications(
        userId,
        userToken,
        adminTokens,
        title,
        body,
        data,
        "admin"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          `${deleteResult.deletedCount} reports deleted successfully`
        )
      );
  } catch (error) {
    console.error(error); // Log the error for debugging
    return ApiError(res, 500, "Internal Server Error!");
  }
});

// Update only the status of a report (notification setup complete only in this controller)
const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reportStatus } = req.body;

  try {
    // Update only the status
    const updatedReportStatus = await Reports.findByIdAndUpdate(
      id,
      {
        reportStatus,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "email fullname fcmToken");

    if (!updatedReportStatus) {
      return ApiError(res, 404, "Report not found!");
    }

    // Access the user's email from the populated userId field
    const userEmail = updatedReportStatus.userId.email;
    const userFullName = updatedReportStatus.userId.fullname;
    const userToken = updatedReportStatus.userId.fcmToken;

    // Send notifications
    const adminTokens = await getAdminTokens();
    const { title, body } = crimeReportStatusTemplate(
      updatedReportStatus.caseNumber,
      updatedReportStatus.reportStatus
    );

    const data = {
      caseNumber: updatedReportStatus.caseNumber,
      reportId: updatedReportStatus._id,
    };

    console.log(
      crimeSeverity[updatedReportStatus.incident_type] || defaultSeverity
    );

    await sendNotifications(
      updatedReportStatus.userId._id,
      userToken,
      [],
      title,
      body,
      data,
      crimeSeverity[updatedReportStatus.incident_type] || defaultSeverity
    );

    await sendUpdatedCrimeReportEmail(
      userFullName,
      userEmail,
      updatedReportStatus.caseNumber,
      updatedReportStatus.reportStatus
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedReportStatus,
          "Report status updated successfully"
        )
      );
  } catch (error) {
    console.error("Error updating status:", error);
    return ApiError(res, 500, "Internal Server Error!");
  }
});

// Add a new report by admin
const addNewAdminReport = asyncHandler(async (req, res) => {
  try {
    const {
      complainant_name,
      complainant_email,
      complainant_nic,
      incident_type,
      incident_description,
      location,
      reportStatus,
      policeStationName,
    } = req.body;
    const signatureImage = req.files?.signatureImage?.[0]?.path;
    const evidenceFiles = req.files?.evidenceFiles || [];

    if (
      !complainant_name ||
      !complainant_nic ||
      !complainant_email ||
      !incident_type ||
      !incident_description ||
      !location ||
      !policeStationName ||
      !reportStatus ||
      !signatureImage
    ) {
      return ApiError(res, 400, "All fields are required!");
    }

    const uploadedSignatureImage = await uploadOnCloudinary(signatureImage);

    if (!uploadedSignatureImage) {
      return ApiError(res, 500, "Error uploading signature image!");
    }

    const report = await Reports.create({
      userId: req.user._id,
      incident_type: incident_type,
      incident_description: incident_description,
      location: location,
      reportedDate: new Date(),
      policeStationName,
      reportedTime: new Date().toLocaleTimeString(),
      userLocation: undefined,
      signatureImageUrl: uploadedSignatureImage.url,
      reportStatus: "pending",
      caseNumber: uuidv4(),
      complainant_name: complainant_name,
      complainant_email: complainant_email,
      nic: complainant_nic,
      reportPdfUrl: "initial url",
    });

    if (!report) {
      return ApiError(res, 500, "Error creating report!");
    }

    // Upload and save evidence files
    const evidenceDocs = [];
    for (const file of evidenceFiles) {
      const uploadedFile = await uploadOnCloudinary(file.path);
      if (uploadedFile) {
        const evidence = new Evidence({
          type: uploadedFile.resource_type,
          evidencefileUrl: uploadedFile.url,
          userId: req.user._id,
          reportId: report._id,
          caseNumber: report.caseNumber,
        });
        const savedEvidence = await evidence.save();
        evidenceDocs.push(savedEvidence);
        report.evidences.push(savedEvidence._id);
      }
    }

    await report.save();

    if (!evidenceDocs) {
      return ApiError(res, 500, "Error uploading evidence files!");
    }

    // Transform the report object to match the required structure
    const reportData = {
      caseNumber: report.caseNumber,
      policeStationName: report.policeStationName,
      incident_type: report.incident_type,
      location: report.location,
      name: report.complainant_name,
      email: report.complainant_email,
      request_date: report.reportedDate.toDateString(),
      request_time: report.reportedTime,
      nic: report.nic,
      incident_description: report.incident_description,
    };

    // Generate and upload the PDF
    const pdfFilePath = path.join(
      __dirname,
      "../../public/temp/",
      `Crime_Report${report.caseNumber}.pdf`
    );
    await generateReportPDF(reportData, report.signatureImageUrl, pdfFilePath);

    const uploadedPDF = await uploadOnCloudinary(pdfFilePath);

    if (!uploadedPDF) {
      return ApiError(res, 500, "Error uploading report PDF!");
    }

    report.reportPdfUrl = uploadedPDF.url;
    await report.save();

    // Send confirmation email
    await sendCrimeReportConfirmationEmail(
      complainant_name,
      complainant_email,
      report.caseNumber
    );

    // Send notification to the user and admins
    const { title, body } = addedNewReportByAdminNotificationTemplate(
      report.caseNumber
    );
    const userToken = req.user.fcmToken; // FCM token of the user who created the report
    const adminTokens = getAdminTokens(); // FCM tokens of all admins
    const data = { caseNumber: report.caseNumber, reportId: report._id };

    await sendNotifications(
      req.user._id, // User ID
      userToken, // User FCM token
      adminTokens, // Admin FCM tokens
      title,
      body,
      data,
      "both" // Send to both user and admins
    );

    return res
      .status(201)
      .json(new ApiResponse(200, report, "Report added successfully"));
  } catch (error) {
    console.log(error);
    return ApiError(res, 500, "Internal Server Error!");
  }
});

// update a report by admin ( Remaining )
const updateAdminReport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nic,
      incident_description,
      incident_type,
      policeStationName,
      location,
      complainant_name,
      complainant_email,
    } = req.body;
    const signatureImage = req.files?.signatureImage?.[0]?.path;

    // Find the report to update and populate the userId field to get user details
    const existingReport = await Reports.findById(id);
    if (!existingReport) {
      return ApiError(res, 404, "Report not found!");
    }

    // Initialize update object
    const updateFields = {};

    // Update only if the new value is different
    if (nic && nic.trim() !== existingReport.nic) updateFields.nic = nic.trim();
    if (
      complainant_name &&
      complainant_name.trim() !== existingReport.complainant_name
    )
      updateFields.complainant_name = complainant_name.trim();
    if (
      complainant_email &&
      complainant_email.trim() !== existingReport.complainant_email
    )
      updateFields.complainant_email = complainant_email.trim();
    if (
      incident_description &&
      incident_description.trim() !== existingReport.incident_description
    )
      updateFields.incident_description = incident_description.trim();
    if (incident_type && incident_type !== existingReport.incident_type)
      updateFields.incident_type = incident_type;
    if (
      policeStationName &&
      policeStationName !== existingReport.policeStationName
    )
      updateFields.policeStationName = policeStationName;
    if (location && location !== existingReport.location)
      updateFields.location = location;

    // Handle signature image update
    if (signatureImage && signatureImage.length > 0) {
      const uploadedSignature = await uploadOnCloudinary(signatureImage);
      if (!uploadedSignature) {
        return ApiError(res, 500, "Error uploading signature image!");
      }
      updateFields.signatureImageUrl = uploadedSignature.url;

      // Delete old signature image from Cloudinary
      if (existingReport.signatureImageUrl) {
        const oldSignatureId = existingReport.signatureImageUrl
          .split("/")
          .pop()
          .split(".")[0];
        await deleteFromCloudinary(oldSignatureId, "image");
      }
    }

    // Update the report in the database with the fields that are actually updated
    const updatedReport = await Reports.findOneAndUpdate(
      { _id: id },
      { $set: updateFields }, // Apply only updated fields
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return ApiError(res, 404, "Error updating the report!");
    }

    // Transform the updated report object to match the required structure
    const mergedReportData = {
      caseNumber: updatedReport.caseNumber,
      policeStationName:
        updatedReport.policeStationName || existingReport.policeStationName,
      incident_type:
        updatedReport.incident_type || existingReport.incident_type,
      location: updatedReport.location || existingReport.location,
      name: updatedReport.complainant_name || existingReport.complainant_name,
      email:
        updatedReport.complainant_email || existingReport.complainant_email,
      request_date: updatedReport.reportedDate.toDateString(),
      request_time: updatedReport.reportedTime,
      nic: updatedReport.nic || existingReport.nic,
      incident_description:
        updatedReport.incident_description ||
        existingReport.incident_description,
    };

    // Generate a new PDF using the merged data and signature image
    const pdfFilePath = path.join(
      __dirname,
      "../../public/temp/",
      `Crime_Report${updatedReport.caseNumber}.pdf`
    );
    await generateReportPDF(
      mergedReportData,
      updatedReport.signatureImageUrl || existingReport.signatureImageUrl,
      pdfFilePath
    );

    // Upload the new PDF to Cloudinary
    const uploadedPDF = await uploadOnCloudinary(pdfFilePath);

    if (!uploadedPDF) {
      return ApiError(res, 500, "Error uploading report PDF!");
    }

    // Update the report's PDF URL in the database
    updatedReport.reportPdfUrl = uploadedPDF.url;
    await updatedReport.save();

    // Send notification to the user and admins
    const { title, body } = updatedReportByAdminNotificationTemplate(
      updatedReport.caseNumber
    );
    const userToken = req.user.fcmToken; // FCM token of the user who created the report
    const adminTokens = getAdminTokens(); // FCM tokens of all admins
    const data = {
      caseNumber: updatedReport.caseNumber,
      reportId: updatedReport._id,
    };

    await sendNotifications(
      req.user._id, // User ID
      userToken, // User FCM token
      adminTokens, // Admin FCM tokens
      title,
      body,
      data,
      "both" // Send to both user and admins
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedReport, "Report updated successfully"));
  } catch (error) {
    console.error("Error updating report:", error);
    return ApiError(res, 500, "Internal Server Error!");
  }
});

export {
  // User controllers
  createUserReport,
  getAllUserReports,
  getSingleUserReport,
  deleteUserReport,
  deleteAllUserReports,
  checkStatus,
  // Admin controllers
  getAllAdminReports,
  getSingleAdminReport,
  updateAdminReport,
  deleteAdminReport,
  deleteAllAdminReports,
  addNewAdminReport,
  updateReportStatus,
};
