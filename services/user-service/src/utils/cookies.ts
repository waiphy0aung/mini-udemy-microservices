import type { CookieOptions } from "express";
import { config } from "@shared";

const parseDurationMs = (val?: string): number | undefined => {
  if (!val) return undefined;
  const m = String(val).trim().match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || 's').toLowerCase();
  switch (unit) {
    case 'ms': return n;
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return undefined;
  }
}

export const tokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: "lax",
  maxAge: parseDurationMs(config.jwt.expiresIn) ?? 8 * 60 * 60 * 1000,
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: "lax",
  maxAge: parseDurationMs((config.jwt as any).refresh?.expiresIn) ?? 30 * 24 * 60 * 60 * 1000,
  path: "/", // send on all routes to reach refresh endpoint easily
};
