import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileUploadMiddleware } from "./src/middlewares/multer.js"

const app = express();

// Middleware for CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',  
    credentials: true,
}));

// Body parsing middleware
app.use(fileUploadMiddleware);
app.use(express.json({ limit: "16Kb" }));
app.use(express.urlencoded({ extended: true, limit: "16Kb" }));
app.use(cookieParser());

// Error handling middleware for Express
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error!",
        errors: err.errors || [],
    });
});  

import router from "./src/routes/auth.routes.js";
import userRouter from "./src/routes/userRoutes.js";
import adminRouter from "./src/routes/adminRoute.js";
import feedbackRouter from "./src/routes/feedbackRoute.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import evidenceRouter from "./src/routes/evidenceRoutes.js";
import notificationRouter from "./src/routes/notificationRoute.js";

app.use("/api/auth", router);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reports", reportRoutes);
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/evidences", evidenceRouter);
app.use("/api/notifications", notificationRouter);

export default app;
