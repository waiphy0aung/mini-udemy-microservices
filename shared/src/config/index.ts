import dotenv from "dotenv";
import envSchema from "./env.validation";

dotenv.config({ path: ".env" });

// const dbUsername = encodeURIComponent(process.env.POSTGRES_USER || "")
// const dbPassword = encodeURIComponent(process.env.POSTGRES_PASSWORD || "")
// const credentialSegment = dbUsername && dbPassword ? `${dbUsername}:${dbPassword}@` : "";
// const computedDBURL = `postgresql://${credentialSegment}${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}?schema=public`
// const finalDBURL = process.env.DATABASE_URL || computedDBURL

const { value: env, error } = envSchema.validate(
  process.env,
  { abortEarly: false }
)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  env: env.NODE_ENV,
  ports: {
    gateway: env.GATEWAY_PORT,
    userService: env.USER_SERVICE_PORT,
    courseService: env.COURSE_SERVICE_PORT,
    videoService: env.VIDEO_SERVICE_PORT,
    paymentService: env.PAYMENT_SERVICE_PORT,
    reviewService: env.REVIEW_SERVICE_PORT,
    progressService: env.PROGRESS_SERVICE_PORT,
    notificationService: env.NOTIFICATION_SERVICE_PORT,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refresh: {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }
  },
  corsOrigin: env.CORS_ORIGIN
}

export default config;
