import rateLimit from "express-rate-limit";

// General API rate limiter
const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `windowMs`
    message: "Too many requests from this IP, please try again after 15 minutes",
    headers: true,
    handler: (req, res, next) => {
        // Send JSON response directly
        res.status(429).json({
            success: false,
            status: 429,
            message: "Too many requests from this IP, please try again after 15 minutes",
            errors: [],
        });
    },
});

// Forgot password rate limiter
const forgotPasswordRateLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3, // Limit each IP to 3 requests per `windowMs`
    message: "Too many password reset attempts! Please try again after 30 minutes.",
    headers: true,
    handler: (req, res, next) => {
        res.status(429).json({
            success: false,
            status: 429,
            message: "Too many password reset attempts! Please try again after 30 minutes.",
            errors: [],
        });
    },
});

// Login rate limiter
const loginRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 login attempts per `windowMs`
    message: "Too many login attempts! Please try again after 10 minutes.",
    headers: true,
    handler: (req, res, next) => {
        res.status(429).json({
            success: false,
            status: 429,
            message: "Too many login attempts! Please try again after 10 minutes.",
            errors: [],
        });
    },
});

// Fake report rate limiter
const fakeReportRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // Limit each IP to 3 reports per `windowMs`
    message: "Too many reports from this IP in a short period, please try again later.",
    headers: true,
    handler: (req, res, next) => {
        res.status(429).json({
            success: false,
            status: 429,
            message: "Too many reports from this IP in a short period, please try again later.",
            errors: [],
        });
    },
});

export { apiRateLimiter, forgotPasswordRateLimiter, loginRateLimiter, fakeReportRateLimiter };
