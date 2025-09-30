import { errorConverter, errorHandler, config } from "@shared";
import type { Express } from "express";
import { app as sharedApp, notFound } from "@shared";
import router from "./routes";
import { setupSwagger } from './docs/swagger';

const app: Express = sharedApp;

// Swagger docs - disabled in production
if (config.env !== 'production') {
  setupSwagger(app);
}

// Health check
app.get("/health", (_req: any, res: any) => {
  res.success({ service: "user", uptime: process.uptime() }, "OK");
});

app.use("/", router)

// Example route behind gateway proxy: GET /api/users/profile -> /profile here
app.get("/profile", (_req: any, res: any) => {
  res.success({ id: 1, email: "demo@example.com", role: "STUDENT" }, "OK");
});

app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

export default app;
