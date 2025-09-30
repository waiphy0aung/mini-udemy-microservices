import Redis from "ioredis";
import { logger } from "./logger";

let redis: Redis | undefined;

export const getRedis = (): Redis => {
  if (redis) return redis;

  // Prefer connection string when provided; otherwise use host/port options
  const opts = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true,
        reconnectOnError: (err: Error) => {
          logger.warn({ msg: "Redis reconnectOnError", err: err.message });
          return true;
        },
        retryStrategy: (times: number) => Math.min(times * 200, 2000),
      };

  const RedisCtor: any = Redis as any;
  redis = new RedisCtor(opts as any);

  const client = redis as Redis;
  client.on("connect", () => logger.info(`Redis connecting... ${process.env.REDIS_PORT}`));
  client.on("ready", () => logger.info("Redis Ready"));
  client.on("error", (err: any) => logger.error({ msg: "Redis error", err: err.message }))
  client.on("end", () => logger.warn("Redis connection closed"))

  return client;
}

export const connectRedis = async () => {
  const client = getRedis();
  if (client.status === "wait" || client.status === "end") {
    await client.connect?.();
  }
  return client;
}

export const quitRedis = async () => {
  if (!redis) return;
  try {
    await redis.quit();
  } catch {
    await redis.disconnect()
  }
}
