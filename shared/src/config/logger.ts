import winston from "winston"
import fs from "fs";
import path from "path";
import config from ".";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

const enumerteErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    return Object.assign({}, info, { message: info.stack })
  }
  return info
})

const devConsoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp(),
  winston.format.printf(
    ({ level, message, timestamp, reqId, stack, ...rest }) => {
      const id = reqId ? ` [req:${reqId}]` : "";
      const metaKeys = Object.keys(rest).filter(k => !["level", "message", "timestamp"].includes(k))
      const meta = metaKeys.length ? ` ${JSON.stringify(rest, null, 0)}` : "";

      const baseLog = `${timestamp} ${level}${id}: ${message}`
      return stack
        ? `${baseLog}\n${stack}`
        : `${baseLog}${meta}`
    }
  )
)

const jsonFormat = winston.format.combine(
  enumerteErrorFormat(),
  winston.format.timestamp(),
  winston.format.json()
)

export const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || "info",
  format: jsonFormat,
  transports: [
    new winston.transports.Console({
      silent: config.env === 'test',
      handleExceptions: true,
      format: devConsoleFormat
    }),
    // File transports use a Docker-aligned absolute dir when running in containers,
    // and a local relative dir during development. Ensure the dir exists.
    ...(() => {
      const baseDir = process.env.LOG_DIR
        || (process.env.DOCKER_ENV ? "/app/logs" : path.resolve(process.cwd(), "logs"));
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch {}
      return [
        new winston.transports.File({ filename: path.join(baseDir, "app.log") }),
        new winston.transports.File({ filename: path.join(baseDir, "error.log"), level: 'error' })
      ]
    })()
  ],
  exitOnError: false
})
