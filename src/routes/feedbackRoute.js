import express from "express";
import { createFeedback, getAllFeedbacks, getSingleFeedback, deleteFeedback, deleteAllFeedbacks } from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const feedbackRouter = express.Router();

// user routes
feedbackRouter.route("/").post(createFeedback);

// admin routes
feedbackRouter.route("/").get(verifyJWT, isAdmin, getAllFeedbacks);
feedbackRouter.route("/:id").get(verifyJWT, isAdmin, getSingleFeedback);
feedbackRouter.route("/:id").delete(verifyJWT, isAdmin, deleteFeedback);
feedbackRouter.route("/").delete(verifyJWT, isAdmin, deleteAllFeedbacks);

export default feedbackRouter;
