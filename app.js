import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileUploadMiddleware } from "./src/middlewares/multer.js";

const app = express();

// ✅ Define allowed origins (You can also use env var here)
const allowedOrigins = [
  'https://crime-gpt.netlify.app',
  'https://crimegpt-frontend.vercel.app'
];

// ✅ Define CORS options once
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true, // Required for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS middleware only once
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ✅ Body parsing middleware
app.use(fileUploadMiddleware);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Your routes
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

// ✅ Centralized error handler (keep at the bottom)
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error!",
    errors: err.errors || [],
  });
});

export default app;
