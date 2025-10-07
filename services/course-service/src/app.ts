import { errorConverter, errorHandler } from "@shared";
import type { Express } from "express";
import { app as sharedApp, notFound } from "@shared";
import router from "./routes";

const app: Express = sharedApp;

// Health check
app.get("/health", (_req: any, res: any) => {
  res.success({ service: "course", uptime: process.uptime() }, "OK");
});

app.use("/", router)

app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

export default app;
