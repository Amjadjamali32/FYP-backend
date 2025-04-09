import { Notifications } from "../models/notification.models.js"
import { asyncHandler } from "../Utils/AsyncHandler.js"
import { ApiError } from "../Utils/ApiErrorResponse.js"
import { ApiResponse } from "../Utils/ApiSuccessResponse.js"

// admin controllers 
// get all notifications
const getAllAdminNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notifications.find();
    const totalNotifications = notifications.length;

    // If there are no notifications, return a specific response
    if (totalNotifications === 0) {
      return res
      .status(200)
      .json({
        message: 'No notifications found',
        totalNotifications: 0,
        notifications: [],
      });
    }

    return res
    .status(200)
    .json(new ApiResponse(200, { totalNotifications, notifications }, 'Notifications retrieved successfully'));
  } catch (error) {
    console.error(error.message);
    return ApiError(res, 500,'Failed to fetch notifications!');
  }
});

// delete all notifications
const deleteAllAdminNotifications = asyncHandler(async (req, res) => {
  try {
    const totalNotifications = await Notifications.countDocuments();
    if (totalNotifications === 0) {
      return res
      .status(200)
      .json(new ApiResponse(200, totalNotifications, "No nogifications found!"));
    }
    await Notifications.deleteMany();
    return res
    .status(200)
    .json(new ApiResponse(200, {}, 'All notifications deleted successfully'));
  } catch (error) {
    return ApiError(res, 500, 'Failed to delete notifications!');
  }
});

// get single notification
const getSingleAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params; 
  try {
    const notification = await Notifications.findById(id); 
    if (!notification) {
      return ApiError(res, 404, 'Notification not found!');
    }
    return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification fetched successfully"));
  } catch (error) {
    return ApiError(res, 500, "Failed to fetch notification!");
  }
});

// delete single notification
const deleteSingleAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;  
  try {
    const notification = await Notifications.findByIdAndDelete(id); 
    if (!notification) { 
      return ApiError(res, 404, 'Notification not found!'); 
    };
    return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Notification deleted successfully'));
  } catch (error) {
    return ApiError(res, 500,'Failed to delete notification');
  }
});

// user controllers
// get all notifications
const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notifications.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const totalNotifications = notifications.length;

    return res.status(200).json(
      new ApiResponse(200, { totalNotifications, notifications }, totalNotifications === 0 ? "No notifications found" : "User notifications retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return ApiError(res, 500, "Failed to fetch user notifications!");
  }
});

// mark notification as read by user
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;  

    try {
      const notification = await Notifications.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }  
      );

      if (!notification) {
        return ApiError(res, 404, "Notification not found");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification marked as read"));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return ApiError(res, 500, "Internal Server error!");;
    }
};

// get single notification
const getUserSingleNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;  
  try {
      const notification = await Notifications.findOneAndUpdate(
          { _id: id, userId },  
          { isRead: true },     
          { new: true }        
      );
      if (!notification) {
        return ApiError(res, 404, 'Notification not found!');
      }

      return res
      .status(200)
      .json(new ApiResponse(200, notification, 'Notification fetched successfully'));
  } catch (error) {
    return ApiError(500, res, "Internal server error!");
  }
});

// delete single notification
const deleteUserNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;  
  try {
      const notification = await Notifications.findOneAndDelete({ _id: id, userId });
      if (!notification) {
        return ApiError(res, 404, 'Notification not found!');
      } 
      return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Notification deleted successfully'));
  } catch (error) {
      return ApiError(res, 500, 'Failed to delete notification!');
  }
});

// delete all notifications
const deleteAllUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;  
  try {
    const result = await Notifications.deleteMany({ userId });  
    return res
    .status(200)
    .json(new ApiResponse(200, {}, 'All notifications deleted successfully'));
  } catch (error) {
    return ApiError(res, 500, 'Failed to delete notifications!');
  }
});

export {
  getAllAdminNotifications,
  deleteAllAdminNotifications,
  getSingleAdminNotification,
  deleteSingleAdminNotification,
  getUserNotifications,
  getUserSingleNotification,
  deleteUserNotification,
  deleteAllUserNotifications,
  markNotificationAsRead,
}