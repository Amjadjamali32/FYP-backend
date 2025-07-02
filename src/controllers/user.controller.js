import { User } from '../models/user.models.js';
import { Feedback } from "../models/feedback.models.js"
import { Evidence } from "../models/evidence.models.js"
import { Notifications } from "../models/notification.models.js"
import { Reports } from '../models/report.model.js';
import { uploadOnCloudinaryBuffer, deleteFromCloudinary} from "../services/cloudinary.js"
import { ApiError } from "../Utils/ApiErrorResponse.js"
import { ApiResponse } from "../Utils/ApiSuccessResponse.js"
import { asyncHandler } from "../Utils/AsyncHandler.js"
import { sendPasswordChangeConfirmationEmail } from "../services/emailServices.js"
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// user controllers
// update password
const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword , newPassword } = req.body;

    if(!oldPassword || !newPassword){
        return ApiError(res, 400, "Please provide old password and new password!");
    }

    const user = await User.findById(req.user._id);

    const isPasswordMatch = await user.matchPassword(oldPassword);

    if(!isPasswordMatch){
        return ApiError(res, 400, "Old password is incorrect!");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    await sendPasswordChangeConfirmationEmail(user.fullname, user.email);

    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Password updated successfully")
    );
});

// updateAccountDetails
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email, NICNumber } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  try {
    // Fetch the user
    const user = await User.findById(req.user?._id);

    if (!user) {
      return ApiError(res, 404, "User not found!");
    }

    let updatedProfileImageUrl = user.profileImage;

    // ✅ Update profile image if provided
    if (profileImage) {
      if (user.profileImage) {
        // Delete old image from Cloudinary
        const oldImagePublicId = user.profileImage.split("/").pop().split(".")[0];
        try {
          await deleteFromCloudinary(oldImagePublicId);
        } catch (error) {
          console.error("Error deleting old image from Cloudinary:", error.message);
        }
      }

      // ✅ Upload new image using buffer function
      const uploadedImage = await uploadOnCloudinaryBuffer(profileImage.buffer, profileImage.originalname);

      if (!uploadedImage?.url) {
        return ApiError(res, 500, "Error while uploading profile image!");
      }

      updatedProfileImageUrl = uploadedImage.url;
    }

    // ✅ Update user details
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullname: fullname || user.fullname,
          email: email || user.email,
          profileImage: updatedProfileImageUrl,
          NICNumber: NICNumber || user.NICNumber,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "Account details updated successfully")
    );
  } catch (error) {
    console.error("Error updating account details:", error.message);
    return ApiError(res, 500, "Internal Server Error");
  }
});

// userDashboard 
const userDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get the count of reports based on different statuses
    const totalReports = await Reports.countDocuments({ userId, deletedByUser: false });
    const totalRejected = await Reports.countDocuments({ userId, reportStatus: 'rejected', deletedByUser: false });
    const totalResolved = await Reports.countDocuments({ userId, reportStatus: 'resolved', deletedByUser: false });
    const totalPending = await Reports.countDocuments({ userId, reportStatus: 'pending', deletedByUser: false });
    const totalInvestigating = await Reports.countDocuments({ userId, reportStatus: 'investigating', deletedByUser: false });
    const totalClosed = await Reports.countDocuments({ userId, reportStatus: 'closed', deletedByUser: false });

    // Return the counts of reports, even if all are 0
    return res
        .status(200)
        .json(new ApiResponse(200, {
            totalReports,
            totalRejected,
            totalResolved,
            totalPending,
            totalInvestigating,
            totalClosed,
        }, "Reports data fetched successfully"));
});

// Admin controllers
// Get a single user by ID (Admin Only)
const getSingleUser = asyncHandler(async (req, res) => {
    const { id } = req.params;   

    try {
        const user = await User.findById(id).select("-password -refreshToken"); 
        if (!user) {
           return ApiError(res, 404, "User not found!");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched Successfully"))
    } catch (error) {
        return ApiError(res, 500, error.message);
    }
});

// Delete a single user by ID (Admin Only)
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        // Get the current user and user to delete
        const currentUser = await User.findById(req.user.id);
        const userToDelete = await User.findById(id);

        if (!userToDelete) {
            return ApiError(res, 404, "User not found!");
        }

        // Ensure admins cannot delete themselves
        if (currentUser.role === 'admin' && userToDelete._id.toString() === currentUser._id.toString()) {
            return ApiError(res, 403, "Admins cannot delete themselves.");
        }

        // Non-admin users cannot delete admins
        if (userToDelete.role === 'admin' && currentUser.role !== 'admin') {
            return ApiError(res, 403, "You are not authorized to delete an admin.");
        }

        // Proceed to delete the user
        await User.findByIdAndDelete(id);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'User deleted successfully'));

    } catch (error) {
        return ApiError(res, 500, error.message);
    }
});

// Delete all users (Admin Only)
const deleteAllUsers = asyncHandler(async (req, res) => {
    try {
            const result = await User.deleteMany({ role: { $ne: 'admin' } });

            // Check if any users were deleted
            if (result.deletedCount === 0) {
                return ApiError(res, 404, "No users found to delete!");
            }

            return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "All users deleted successfully")
            );
        } catch (error) {
            return ApiError(res, 500, error.message);
        }
});

// update  user  (Admin Only)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullname, email, mobile, gender, password, role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiError(res, 400, "Invalid user ID format!");
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return ApiError(res, 404, "User not found!");
    }

    const updateData = {};

    if (fullname) updateData.fullname = fullname;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (gender) updateData.gender = gender;
    if (role) updateData.role = role;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Handle profile image upload (via buffer)
    const profileImage = req.files?.profileImage?.[0];
    if (profileImage) {
      if (user.profileImage) {
        const oldImagePublicId = user.profileImage.split("/").pop().split(".")[0];
        try {
          await deleteFromCloudinary(oldImagePublicId);
        } catch (error) {
          console.error("Error deleting old image from Cloudinary:", error.message);
        }
      }

      const uploadedProfileImage = await uploadOnCloudinaryBuffer(profileImage.buffer, profileImage.originalname);
      if (!uploadedProfileImage?.url) {
        return ApiError(res, 500, "Error while uploading profile image!");
      }
      updateData.profileImage = uploadedProfileImage.url;
    }

    // Handle NIC image upload (via buffer)
    const nicImage = req.files?.NICImage?.[0];
    if (nicImage) {
      if (user.NICImage) {
        const oldNICImagePublicId = user.NICImage.split("/").pop().split(".")[0];
        try {
          await deleteFromCloudinary(oldNICImagePublicId);
        } catch (error) {
          console.error("Error deleting old NIC image from Cloudinary:", error.message);
        }
      }

      const uploadedNICImage = await uploadOnCloudinaryBuffer(nicImage.buffer, nicImage.originalname);
      if (!uploadedNICImage?.url) {
        return ApiError(res, 500, "Error while uploading NIC image!");
      }
      updateData.NICImage = uploadedNICImage.url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return ApiError(res, 500, "Error updating user!");
    }

    return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
  } catch (error) {
    console.error("Error updating user:", error.message);
    return ApiError(res, 500, "Internal Server Error");
  }
});

// Get all users with optional search and pagination (Admin Only) (no search for nic)
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 6, nic, sortBy = "fullname", sortType = "asc" } = req.query;

    const skip = (Math.max(page, 1) - 1) * limit; 
    const filter = {};

    if (nic) {
        const sanitizedNic = nic.replace(/[^a-zA-Z0-9]/g, ""); 
        filter.NICNumber = new RegExp(sanitizedNic, "i"); 
    }

    const sort = { [sortBy]: sortType === "desc" ? -1 : 1 }; 

    try {
        const users = await User.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select("-password -refreshToken"); 

        const totalUsers = await User.countDocuments(filter);
        if (!users.length) {
            return ApiError(res, 404, "No users found!");
        }

        return res.status(200).json(
            new ApiResponse(200, {
                users,
                totalUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: parseInt(page),
                perPage: parseInt(limit),
            }, "Users fetched successfully")
        );
    } catch (error) {
        return ApiError(res, 500, error.message);
    }
});

// adminDashboard controller with error handling 
const AdminDashboard = asyncHandler(async (req, res) => {
    try {
        // Existing counts and statistics
        const totalUsers = await User.countDocuments() || 0;
        const totalReports = await Reports.countDocuments() || 0;
        const totalPending = await Reports.countDocuments({ reportStatus: 'pending' }) || 0;
        const totalResolved = await Reports.countDocuments({ reportStatus: 'resolved' }) || 0;
        const totalRejected = await Reports.countDocuments({ reportStatus: 'rejected' }) || 0;
        const totalInvestigating = await Reports.countDocuments({ reportStatus: 'investigating' }) || 0;
        const totalClosed = await Reports.countDocuments({ reportStatus: 'closed' }) || 0;
        const totalFeedbacks = await Feedback.countDocuments() || 0;
        const totalEvidences = await Evidence.countDocuments() || 0;
        const totalNotifications = await Notifications.countDocuments() || 0;

        const crimeCategories = await Reports.aggregate([
            {
                $match: { incident_type: { $ne: null, $ne: "" } }
            },
            {
                $addFields: {
                    incident_type_normalized: { $toLower: { $trim: { input: "$incident_type" } } }
                }
            },
            {
                $group: {
                    _id: '$incident_type_normalized',
                    count: { $sum: 1 }
                }
            }
        ]) || [];

        const reportStatusStats = await Reports.aggregate([
            {
                $group: { _id: '$reportStatus', count: { $sum: 1 } }
            }
        ]) || [];

        const genderStatistics = await User.aggregate([
            {
                $group: { _id: '$gender', count: { $sum: 1 } }
            }
        ]) || [];

        const genderStatsMap = genderStatistics.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        const maleUsers = genderStatsMap['male'] || 0;
        const femaleUsers = genderStatsMap['female'] || 0;
        const otherUsers = genderStatsMap['other'] || 0;

        // Fetching report locations
        const reportLocations = await Reports.find({}, 'userLocation incident_type reportStatus').populate('userLocation', 'latitude longitude');

        return res.status(200).json(new ApiResponse(200, {
            totalUsers,
            totalReports,
            totalPending,
            totalResolved,
            totalRejected,
            totalInvestigating,
            totalClosed,
            totalFeedbacks,
            totalEvidences,
            totalNotifications,
            crimeCategories,
            reportStatusStats,
            genderStatistics: {
                male: maleUsers,
                female: femaleUsers,
                other: otherUsers
            },
            reportLocations // Add location data for mapping
        }, "Dashboard data fetched successfully"));
    } catch (error) {
        console.error(error);
        return ApiError(res, 500, 'Something went wrong while fetching the data.');
    }
});

export  {
    updateAccountDetails,
    updatePassword,
    userDashboard,
    getSingleUser,
    getAllUsers,
    updateUser,
    deleteUser,
    deleteAllUsers,
    AdminDashboard,
}