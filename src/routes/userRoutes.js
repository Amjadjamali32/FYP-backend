import express from "express";
import { verifyJWT } from "../middlewares/auth.js"
import { updateAccountDetails, updatePassword, userDashboard } from "../controllers/user.controller.js"
import { fileUploadMiddleware } from "../middlewares/multer.js"

const userRouter = express.Router();

// user routes
userRouter.route("/:id/password").patch(verifyJWT, updatePassword);
userRouter.route("/:id/account").put(verifyJWT, updateAccountDetails, fileUploadMiddleware);
userRouter.route("/dashboard").get(verifyJWT, userDashboard);

export default userRouter;

