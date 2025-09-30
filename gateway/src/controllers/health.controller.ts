import type { Request, Response } from "express"
import { services } from "../configs/services";

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
export const health = (_req: Request, res: Response) => {
  (res as any).success({ uptime: process.uptime() }, "OK");
}

/**
 * @swagger
 * /health/services:
 *   get:
 *     summary: Check downstream service health
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicesHealthResponse'
 */
export const healthServices = async (_req: Request, res: Response) => {
  const healthChecks = await Promise.allSettled(
    Object.entries(services).map(async ([route, url]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${url}/health`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        return {
          service: route,
          url,
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status
        };
      } catch (error) {
        return {
          service: route,
          url,
          status: 'unreachable',
          error: (error as Error).message
        };
      }
    })
  );

  const results = healthChecks.map(result =>
    result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }
  );

  (res as any).success({ services: results }, "Service Health Status");
}
