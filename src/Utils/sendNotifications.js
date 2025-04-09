// import admin from "../config/firebase.js";
// import { Notifications } from "../models/notification.models.js";

// export const sendNotifications = async (userId, userToken, adminTokens=[], title, body, data = {}, severity = "Low") => {
  
//   try {
//     if (!userToken && (!adminTokens || adminTokens.length === 0)) {
//       console.error("No valid user or admin tokens!");
//       return null;
//     }

//     // Save notification in the database
//     const notification = new Notifications({
//       userId,
//       reportId: data.reportId,
//       caseNumber: data.caseNumber,
//       title,
//       body,
//       data,
//       severity,  
//     });

//     await notification.save();

//     if (!notification) {
//       console.error("Failed to save notification");
//       return null;
//     }

//     // Prepare message payload
//     const message = {
//       notification: {
//         title,
//         body,
//       },
//       data: {
//         caseNumber: String(data.caseNumber || ""),
//         severity: String(severity), 
//       },
//       tokens: [userToken, ...adminTokens].filter(Boolean), 
//     };

//     // Send notification to multiple recipients
//     const response = await admin.messaging().sendEachForMulticast(message);
//     console.log("Successfully sent messages:", response);

//     return response;
//   } catch (error) {
//     console.error("Error sending notifications:", error);
//     return null;
//   }
// };


import admin from "../config/firebase.js";
import { Notifications } from "../models/notification.models.js";

export const sendNotifications = async (
  userId,
  userToken,
  adminTokens = [],
  title,
  body,
  data = {},
  severity = "Low",
  recipientType = "both" // "user", "admin", or "both"
) => {
  try {
    // Validate recipient type
    if (recipientType !== "user" && recipientType !== "admin" && recipientType !== "both") {
      console.error("Invalid recipient type! Must be 'user', 'admin', or 'both'.");
      return null;
    }

    // Validate tokens based on recipient type
    if (recipientType === "user" && !userToken) {
      console.error("No valid user token provided for user notification!");
      return null;
    }

    if (recipientType === "admin" && (!adminTokens || adminTokens.length === 0)) {
      console.error("No valid admin tokens provided for admin notification!");
      return null;
    }

    if (recipientType === "both" && !userToken && (!adminTokens || adminTokens.length === 0)) {
      console.error("No valid user or admin tokens provided!");
      return null;
    }

    // Save notification in the database
    const notification = new Notifications({
      userId,
      reportId: data.reportId,
      caseNumber: data.caseNumber,
      title,
      body,
      data,
      severity,
    });

    await notification.save();

    if (!notification) {
      console.error("Failed to save notification");
      return null;
    }

    // Prepare tokens based on recipient type
    let tokens = [];
    if (recipientType === "user") {
      tokens = [userToken].filter(Boolean); // Only user token
    } else if (recipientType === "admin") {
      tokens = adminTokens.filter(Boolean); // Only admin tokens
    } else if (recipientType === "both") {
      tokens = [userToken, ...adminTokens].filter(Boolean); // Both user and admin tokens
    }

    // Prepare message payload
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        caseNumber: String(data.caseNumber || ""),
        severity: String(severity),
      },
      tokens, // Use the filtered tokens
    };

    // Send notification to multiple recipients
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Successfully sent messages:", response);

    return response;
  } catch (error) {
    console.error("Error sending notifications:", error);
    return null;
  }
};