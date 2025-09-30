import type { Request, Response } from "express";
import { createProxyMiddleware, type Options as ProxyOptions } from "http-proxy-middleware";
import { logger, config } from "@shared";

// Build proxy options for a given target and mounted route prefix.
export const makeProxyOptions = (targetBase: string, route: string): ProxyOptions => {
  const PROXY_TIMEOUT_MS = 10_000;
  const CLIENT_TIMEOUT_MS = 30_000;
  const proxyLogLevel = (config.env === "production" ? "warn" : "debug") as Required<ProxyOptions>["logLevel"];

  return {
    target: targetBase,
    changeOrigin: true,
    ws: true,
    proxyTimeout: PROXY_TIMEOUT_MS,
    timeout: CLIENT_TIMEOUT_MS,
    logLevel: proxyLogLevel,
    // Strip the mount path (e.g. /users) and forward the remainder
    // pathRewrite: (path: string) => {
    //   const re = new RegExp(`^${route}(?=/|$)`);
    //   const newPath = path.replace(re, "") || "/";
    //   console.log(newPath)
    //   return newPath;
    // },
    onProxyReq(proxyReq, req: Request) {
      logger.debug(`Proxying ${req.method} ${req.path} -> ${targetBase}`);

      // Pass-through important headers
      if (req.headers["authorization"]) proxyReq.setHeader("authorization", req.headers["authorization"] as string);
      if (req.headers["cookie"]) proxyReq.setHeader("cookie", req.headers["cookie"] as string);
      proxyReq.setHeader("x-request-id", (req as any).id || "no-id");
      if ((req as any).user) proxyReq.setHeader("x-user-id", (req as any).user.id);

      // If body was parsed already, serialize it for upstream
      const method = req.method?.toUpperCase();
      const hasBody = method && method !== "GET" && method !== "HEAD" && (req as any).body;
      if (!hasBody) return;

      try {
        const contentType = String(req.headers["content-type"] || "").toLowerCase();
        let bodyData: string | undefined;

        if (!contentType || contentType.startsWith("application/json")) {
          bodyData = JSON.stringify((req as any).body);
          proxyReq.setHeader("content-type", "application/json");
        } else if (contentType.startsWith("text/plain")) {
          bodyData = typeof (req as any).body === "string" ? (req as any).body : String((req as any).body ?? "");
          proxyReq.setHeader("content-type", "text/plain");
        }

        if (bodyData !== undefined) {
          proxyReq.setHeader("content-length", Buffer.byteLength(bodyData, "utf8").toString());
          proxyReq.write(bodyData);
        }
      } catch (e) {
        logger.warn(`Failed to forward proxy body: ${(e as Error).message}`);
      }
    },
    onProxyRes(proxyRes, req: Request) {
      logger.debug(`Proxy response: ${proxyRes.statusCode} for ${req.path}`);
    },
    onError(err, req: Request, res: Response) {
      logger.error(`Proxy error for ${req.path}:`, { message: (err as Error).message, stack: (err as Error).stack, target: targetBase });
      if (!res.headersSent) {
        res.status(502).json({ error: "bad_gateway", details: (err as Error).message, requestId: (req as any).id, path: req.path, target: targetBase });
      }
    },
  };
};

// Convenience helper to create the middleware directly
export const createProxy = (route: string, targetBase: string) =>
  createProxyMiddleware(makeProxyOptions(targetBase, route));
