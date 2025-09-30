import http from "http";
import app from "./app";
import { config, logger } from "@shared";

let server: http.Server | undefined;
let shuttingDown = false;

const start = async () => {
  server = http.createServer(app);

  const PORT = config.ports.gateway
  server.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT} (${config.env})`)
  })
}

process.on("uncaughtException", (err) => {
  logger.error({ message: "Uncaught Exception", stack: err.stack });
  shutdown(1);
});

process.on("unhandledRejection", (reason) => {
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
    .then(
      () =>
        server &&
        new Promise<void>((resolve) => server!.close(() => resolve())),
    )
    .then(() => logger.info("HTTP server closed"))
    .finally(() => process.exit(code));
};

start();
