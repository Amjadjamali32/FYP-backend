export const crimeReportStatusTemplate = (reportId, newStatus) => {
  const title = "Crime Report Status Update";
  let body = "";

  switch (newStatus) {
    case "inprogress":
      body = `Your crime report (ID: ${reportId}) is currently under review. We will update you once it's processed.`;
      break;
    case "resolved":
      body = `Good news! Your crime report (ID: ${reportId}) has been resolved. Thank you for your report.`;
      break;
    case "rejected":
      body = `We're sorry, but your crime report (ID: ${reportId}) has been rejected. If you have additional information, feel free to resubmit.`;
      break;
    case "closed":
      body = `Dear complainant! Your crime report (ID: ${reportId}) has been closed. Thank you for your report.`;
      break;
    default:
      body = `The status of your crime report (ID: ${reportId}) has been updated.`;
  }

  return { title, body };
};

export const newComplaintTemplate = (complaintId) => ({
  title: "New Complaint Registration",
  body: `Your complaint (ID: ${complaintId}) has been successfully registered. Our team will review it shortly.`,
});

export const deleteComplaintTemplate = (complaintId) => ({
  title: "Complaint Deletion",
  body: `Your complaint (ID: ${complaintId}) has been deleted. If this was an error, please submit a new complaint.`,
});

export const deleteAllComplaintTemplate = (userName) => ({
  title: "Complaint Deletion",
  body: `Dear ${userName}, Your All reports has been Successfully deleted.`,
});

// these are remaining to complete
export const deleteSingleReportByAdminNotificationTemplate = (reportId) => ({
  title: "Report Deleted",
  body: `A report with ID ${reportId} has been deleted by an admin. If you believe this was a mistake, please contact support.`,
});

export const deleteAllReportsByAdminNotificationTemplate = () => ({
  title: "All Reports Deleted",
  body: "All reports in the system have been deleted by an admin. If this was unexpected, please reach out to support.",
});

export const updatedReportByAdminNotificationTemplate = (reportId) => ({
  title: "Report Updated",
  body: `A report with ID ${reportId} has been updated by an admin. Please review the changes if necessary.`,
});

export const addedNewReportByAdminNotificationTemplate = (reportId) => ({
  title: "New Report Added",
  body: `A new report with ID ${reportId} has been added by an admin. You can view the details in your account.`,
});

export const passwordChangeNotificationTemplate = () => ({
  title: "Password Changed",
  body: "Your account password has been successfully changed. If you didn't make this change, please contact support immediately.",
});

export const accountLoginNotificationTemplate = (deviceInfo) => ({
  title: "Account Login Detected",
  body: `A login was detected on your account from ${deviceInfo.device} (${deviceInfo.browser}) at ${deviceInfo.time}. If this wasn't you, please secure your account immediately.`,
});