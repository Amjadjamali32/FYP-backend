import { ApiError } from "../Utils/ApiErrorResponse.js";

// isAdmin.js
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    // If user is not an admin, throw an error
   return ApiError(res, 403, "Access denied. Admin role required!");
};
