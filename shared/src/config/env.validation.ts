import Joi from "joi";

const envSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
  // API Gateway
  GATEWAY_PORT: Joi.number().port().default(3000),

  // Service Ports
  USER_SERVICE_PORT: Joi.number().port().default(3001),
  COURSE_SERVICE_PORT: Joi.number().port().default(3002),
  VIDEO_SERVICE_PORT: Joi.number().port().default(3003),
  PAYMENT_SERVICE_PORT: Joi.number().port().default(3004),
  REVIEW_SERVICE_PORT: Joi.number().port().default(3005),
  PROGRESS_SERVICE_PORT: Joi.number().port().default(3006),
  NOTIFICATION_SERVICE_PORT: Joi.number().port().default(3007),

  JWT_SECRET: Joi.string().min(10).required(),
  JWT_EXPIRES_IN: Joi.string().default("1h")
  ,
  // Refresh token configuration (optional; falls back to access token secret)
  JWT_REFRESH_SECRET: Joi.string().min(10).default(Joi.ref('JWT_SECRET')),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("30d")
}).unknown(true);

export default envSchema;
