import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import config from "./config";
import { corsOriginFn, parseAllowedOrigins } from "./utils/cors";
import requestId from "./middlewares/requestId";
import responseEnvelope from "./middlewares/response";

if (config.env === "development") console.clear();

const sharedApp: express.Express = express();

// Helmet + CSP tuned for Swagger UI in non-production
const isProd = config.env === "production";
const baseCsp = helmet.contentSecurityPolicy.getDefaultDirectives();
const cspDirectives = {
  ...baseCsp,
  // Swagger UI needs inline styles
  "style-src": ["'self'", "'unsafe-inline'"],
  // Images from self + data URIs (and validator.swagger.io for schema examples)
  "img-src": ["'self'", "data:", "validator.swagger.io"],
  // Keep scripts strict in prod, relax in dev for Swagger UI
  "script-src": isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
  // Helpful relaxations for dev tooling (Swagger UI, etc.)
  ...(isProd
    ? {}
    : {
      "connect-src": ["'self'", "ws:", "http:", "https:"],
      "worker-src": ["'self'", "blob:"],
      "font-src": ["'self'", "data:"],
    }),
} as const;

sharedApp.use(
  helmet({
    contentSecurityPolicy: { directives: cspDirectives },
  }),
);
if (config.env !== "test") {
  sharedApp.use(morgan('combined'));
}
sharedApp.use(express.json({ limit: "2mb" }));
sharedApp.use(express.urlencoded({ extended: true, limit: "2mb" }));
sharedApp.use(cookieParser())

// CORS configuration
const allowedOrigins = parseAllowedOrigins(config.corsOrigin);
sharedApp.use(cors({ origin: corsOriginFn(allowedOrigins), credentials: true }))

// Request tracking and response envelope
sharedApp.use(requestId);
sharedApp.use(responseEnvelope);

export default sharedApp;
