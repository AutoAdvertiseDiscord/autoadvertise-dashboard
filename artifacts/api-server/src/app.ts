import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import session from "express-session";
import MongoStore from "connect-mongo";
import { logger } from "./lib/logger";
import router from "./routes";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const SESSION_SECRET = process.env.SESSION_SECRET || "autoadvertise-dev-secret-change-in-production";
const MONGODB_URI = process.env.MONGODB_URI!;

// Cross-domain when FRONTEND_URL is set OR running in production
// (production deployments always serve the frontend from a different origin)
const isProduction = process.env.NODE_ENV === "production";
const isCrossDomain = !!process.env.FRONTEND_URL || isProduction;

// Trust reverse-proxy so cookies are sent correctly behind Replit's infra
app.set("trust proxy", 1);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      ttl: 7 * 24 * 60 * 60, // 7 days
      touchAfter: 24 * 3600,
    }),
    cookie: {
      // SameSite=None + Secure required for cross-domain cookies (Cloudflare → Replit)
      secure: isCrossDomain,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isCrossDomain ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

export default app;
