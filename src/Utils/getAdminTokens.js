import { User } from "../models/user.models.js";

const getAdminTokens = async () => {
  try {
    const admins = await User.find({
      role: "admin",
      fcmToken: { 
        $exists: true, 
        $ne: null 
      }
    }).select("fcmToken");

    // console.log("Admin tokens from function: ", admins);

    return admins.map(admin => admin.fcmToken);
  } catch (error) {
    console.error("Error fetching admin FCM tokens:", error);
    throw new Error("Unable to fetch admin FCM tokens");
  }
};

export default getAdminTokens;


// export const getAdminTokens = async () => {
//     try {
//       const admins = await User.find({ role: "admin" }).select("fcmToken");
//       const adminTokens = admins.map((admin) => admin.fcmToken).filter((token) => token);
//       return adminTokens;
//     } catch (error) {
//       console.error("Error fetching admin tokens:", error);
//       return [];
//     }
//   };
