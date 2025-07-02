import { verifyJWT } from "../middlewares/auth.js";
import { Router } from "express";
import {
    createUserReport,
    deleteAllUserReports,
    deleteUserReport,
    getAllUserReports,
    getSingleUserReport,
    checkStatus,
    getAllAdminReports,
    getSingleAdminReport,
    deleteAdminReport,
    deleteAllAdminReports,
    updateAdminReport,
    addNewAdminReport,
    updateReportStatus,
} from "../controllers/report.controller.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { fileUploadMiddleware } from "../middlewares/multer.js";

const reportRouter = Router();

// User routes
reportRouter.post("/", verifyJWT, createUserReport, fileUploadMiddleware);
reportRouter.get("/:id", verifyJWT, getSingleUserReport); 
reportRouter.get("/user/:id", verifyJWT, getAllUserReports); 
reportRouter.delete("/:id", verifyJWT, deleteUserReport);
reportRouter.delete("/user/:id", verifyJWT, deleteAllUserReports);
reportRouter.post("/status", verifyJWT, checkStatus);

// Admin routes
reportRouter.post("/admin/", verifyJWT, isAdmin, fileUploadMiddleware, addNewAdminReport);
reportRouter.get("/admin/:id", verifyJWT, isAdmin, getSingleAdminReport);
reportRouter.get("/", verifyJWT, isAdmin, getAllAdminReports);
reportRouter.delete("/admin/:id", verifyJWT, isAdmin, deleteAdminReport);
reportRouter.delete("/admin", verifyJWT, isAdmin, deleteAllAdminReports);
reportRouter.put("/admin/:id", verifyJWT, isAdmin, fileUploadMiddleware, updateAdminReport);
reportRouter.patch("/admin/status/:id", verifyJWT, isAdmin, updateReportStatus);

export default reportRouter;
