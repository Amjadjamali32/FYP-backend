import { verifyJWT } from "../middlewares/auth.js";
import { Router } from "express";
import {
    getAllAdminNotifications,
    getSingleAdminNotification,
    deleteAllAdminNotifications,
    deleteSingleAdminNotification,
    getUserNotifications,
    getUserSingleNotification,
    deleteAllUserNotifications,
    deleteUserNotification,
    markNotificationAsRead,
} from "../controllers/notifications.controller.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const notificationRouter = Router();

// User routes
notificationRouter.get("/user/:id/get", verifyJWT, getUserNotifications);
notificationRouter.patch("/:id/read", verifyJWT, markNotificationAsRead);
notificationRouter.get("/:id", verifyJWT, getUserSingleNotification);
notificationRouter.delete("/:id", verifyJWT, deleteUserNotification);
notificationRouter.delete("/", verifyJWT, deleteAllUserNotifications);

// Admin routes
notificationRouter.get("/admin/all-notifications", verifyJWT, isAdmin, getAllAdminNotifications);
notificationRouter.get("/admin/:id", verifyJWT, isAdmin, getSingleAdminNotification);
notificationRouter.delete("/admin/:id", verifyJWT, isAdmin, deleteSingleAdminNotification);
notificationRouter.delete("/", verifyJWT, isAdmin, deleteAllAdminNotifications);

export default notificationRouter;
