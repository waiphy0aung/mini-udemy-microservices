
export const parseAllowedOrigins = (corsOrigin?: string) =>
  (corsOrigin || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const corsOriginFn =
  (origins: string[]) =>
  (
    origin: string | undefined,
    callback: (err: Error | null, allowed?: boolean) => void,
  ) => {
    if (!origin) return callback(null, true); // non-browser or same-origin
    const isWildcard = origins.length === 1 && origins[0] === "*";
    if (isWildcard || origins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  };

export const socketCorsOrigin = (origins: string[]) => {
  const isWildcard = origins.length === 1 && origins[0] === "*";
  return isWildcard ? "*" : origins;
};
