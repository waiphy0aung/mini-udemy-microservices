import { config, connectRedis, logger } from "@shared";
import app from "./app";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

let shuttingDown = false;

const start = async () => {
  const PORT = config.ports.courseService;

  await connectRedis();
  const server = app.listen(PORT, () => {
    logger.info(`Course Service running on port ${PORT} (${config.env})`);
  });
  return server;
};

process.on("uncaughtException", (err: any) => {
  logger.error({ message: "Uncaught Exception", stack: err.stack });
  shutdown(1);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error({
    message: "Unhandled Rejection",
    stack: (reason as any)?.stack || String(reason),
  });
  shutdown(1);
});

const shutdown = (code: number) => {
  if (shuttingDown) return;
  shuttingDown = true;

  Promise.resolve()
    .then(() => logger.info("HTTP server closed"))
    .finally(() => process.exit(code));
};

start();
