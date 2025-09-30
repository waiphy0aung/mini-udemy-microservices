import { logger } from "../config/logger";
import { getRedis } from "../config/redis";

const client = getRedis();

// stable stringify for keys
const stableStringify = (obj: Record<string, unknown>) =>
  JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((acc: Record<string, unknown>, k: string) => {
        acc[k] = obj[k];
        return acc;
      }, {}),
  );

export const cacheKey = ({
  prefix = "http",
  path = "",
  query = {},
  userId = "",
}: {
  prefix?: string;
  path?: string;
  query?: Record<string, unknown>;
  userId?: string;
}) => {
  const q =
    query && Object.keys(query).length ? `?${stableStringify(query)}` : "";
  const u = userId ? `:u:${userId}` : "";
  return `${prefix}${u}:${path}${q}`;
};

export const getJSON = async (key: string) => {
  const raw = await client.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    logger.warn({
      msg: "cache JSON parse failed",
      key,
      error: (e as any).message,
    });
    return null;
  }
};

export const setJSON = async (key: string, value: unknown, ttlSec = 60) => {
  const str = JSON.stringify(value);
  if (ttlSec > 0) return client.set(key, str, "EX", ttlSec);
  return client.set(key, str);
};

export const del = (key: string) => client.del(key);

// CAUTION: SCAN + DEL is O(n). Use small prefixes or exact keys.
export const delByPrefix = async (prefix: string) => {
  const stream = client.scanStream({ match: `${prefix}*`, count: 100 });
  const pipeline = client.pipeline();
  let count = 0;

  for await (const keys of stream) {
    keys.forEach((k: string) => pipeline.del(k));
    count += keys.length;
  }
  if (count) await pipeline.exec();
  return count;
};

export const ping = () => client.ping();
