import { config } from "@shared";

// Resolve a service base URL from env or sensible defaults.
const getServiceUrl = (serviceName: string, port: number): string => {
  const envKey = `${serviceName.toUpperCase().replace(/-/g, "_")}_URL`;
  const explicit = process.env[envKey];
  if (explicit) return explicit;

  // In Docker, use service DNS name; locally use localhost
  const inDocker = process.env.NODE_ENV === "production" || Boolean(process.env.DOCKER_ENV);
  const host = inDocker ? serviceName : "localhost";
  return `http://${host}:${port}`;
};

export const services: Record<string, string> = {
  "/auth": getServiceUrl("user-service", config.ports.userService || 3001),
  "/users": getServiceUrl("user-service", config.ports.userService || 3001),
  "/courses": getServiceUrl("course-service", config.ports.courseService || 3002),
  "/videos": getServiceUrl("video-service", config.ports.videoService || 3003),
  "/payments": getServiceUrl("payment-service", config.ports.paymentService || 3004),
  "/reviews": getServiceUrl("review-service", config.ports.reviewService || 3005),
  "/progress": getServiceUrl("progress-service", config.ports.progressService || 3006),
  "/notifications": getServiceUrl("notification-service", config.ports.notificationService || 3007),
};
