import NodeCache from "node-cache";

// Create a cache to store failed login attempts
const failedLoginCache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL

// Custom rate limiter for failed login attempts
const failedLoginRateLimiter = (req, res, next) => {
  const ip = req.ip; // Get the client's IP address
  const maxAttempts = 5; // Maximum allowed failed attempts
  const windowMs = 10 * 60 * 1000; // 10 minutes

  // Get the current number of failed attempts for this IP
  const failedAttempts = failedLoginCache.get(ip) || 0;

  if (failedAttempts >= maxAttempts) {
    return res.status(429).json({
      success: false,
      status: 429,
      message: "Too many failed login attempts! Please try again after 10 minutes.",
    });
  }

  // Attach the failedAttempts count to the request object for use in the controller
  req.failedAttempts = failedAttempts;
  next();
};

// Export the cache
export { failedLoginCache };