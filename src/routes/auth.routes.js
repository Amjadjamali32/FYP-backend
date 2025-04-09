import express from "express";
import { registration, verifyEmail, login, forgotPassword, resetPassword, logout, refreshToken, getCurrentUser, updateFCMToken } from "../controllers/auth.controller.js";
import { fileUploadMiddleware } from "../middlewares/multer.js";
import { loginRateLimiter, forgotPasswordRateLimiter } from "../middlewares/rateLimiter.js";
import { verifyJWT }  from "../middlewares/auth.js";

const router = express.Router();

router.route('/register').post(registration, fileUploadMiddleware);
router.route('/verify/:token').get(verifyEmail);
router.route('/login').post(login);
router.route('/refresh-fcm').post(updateFCMToken);
router.route('/profile').get(verifyJWT, getCurrentUser);
router.route('/forgot-password').post(forgotPasswordRateLimiter, forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/refreshToken').post(verifyJWT, refreshToken)
router.route('/logout').post(logout)

export default router;
