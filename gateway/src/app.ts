import type { Express } from "express";
import { app as sharedApp, errorConverter, errorHandler, logger, notFound, config } from "@shared";
import { createProxyMiddleware } from "http-proxy-middleware";
import { makeProxyOptions } from "./configs/proxy";
import { health, healthServices } from "./controllers/health.controller";
import { setupSwagger } from './docs/swagger';
import { services } from "./configs/services";

const app: Express = sharedApp;

// Register proxy routes
for (const [route, target] of Object.entries(services)) {
  app.use(route, createProxyMiddleware(makeProxyOptions(target, route)));
}

// Swagger docs (gateway-level) - disabled in production
if (config.env !== 'production') {
  setupSwagger(app);
}

app.get("/health", health);

// Service health checks
app.get("/health/services", healthServices);

// Final middleware chain
app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

export default app;
