import jwt from "jsonwebtoken";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../Utils/ApiErrorResponse.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Extract token from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");

        // console.log('Token:', token); // Log the token

        if (!token) {
            return ApiError(res, 401, "Access denied. No token provided!");
        }

        // Verify the token
        const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedTokenInfo?._id) {
            return ApiError(res, 401, "Invalid token! Please login again.");
        }

        // Fetch the user and exclude sensitive fields
        const user = await User.findById(decodedTokenInfo._id).select("-password -refreshToken");
        if (!user) {
            return ApiError(res, 404, "User not found. Invalid token!");
        }

        // Attach user to the request object
        req.user = user;
        next();
    } catch (error) {
        return ApiError(res, error.statusCode || 401, error.message || "Authentication failed!");
    }
});