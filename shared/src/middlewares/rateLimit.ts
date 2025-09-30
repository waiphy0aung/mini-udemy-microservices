import rateLimit from "express-rate-limit"

const minute = 60 * 1000;

const rateLimiter = rateLimit({
  windowMs: 5 * minute,
  max: 100, // 100 requests / 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    code: 429,
    message: "Too many requests, please try again later."
  }
})

export default rateLimiter
