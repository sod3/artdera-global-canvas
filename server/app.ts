import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { getEnv } from "./config/env";
import { optionalAuth } from "./middleware/auth";
import { errorHandler, notFound, ok } from "./lib/http";
import { originGuard, payloadGuard } from "./lib/security";
import { authRouter } from "./routes/auth";
import { plansRouter } from "./routes/plans";
import { subscriptionsRouter } from "./routes/subscriptions";
import { storesRouter } from "./routes/stores";
import { artworksRouter } from "./routes/artworks";
import { uploadsRouter } from "./routes/uploads";
import { messagesRouter } from "./routes/messages";
import { commerceRouter } from "./routes/commerce";
import { operationsRouter } from "./routes/operations";
import { galleryRouter } from "./routes/gallery";
import { adminRouter } from "./routes/admin";
import { bootstrapRouter } from "./routes/bootstrap";
import mongoose from "mongoose";

export function createApp() {
  const env = getEnv();
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          mediaSrc: ["'self'", "blob:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === env.APP_URL) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["content-type", "x-requested-with"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());
  app.use(payloadGuard);
  app.use(originGuard);
  app.use(optionalAuth);

  const generalLimit = rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly.",
        fieldErrors: {},
      },
    },
  });
  const authLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many authentication attempts. Please wait and try again.",
        fieldErrors: {},
      },
    },
  });
  const messageLimit = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Message limit reached. Please wait a moment.",
        fieldErrors: {},
      },
    },
  });
  const paymentLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 15,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many payment attempts. Please wait and try again.",
        fieldErrors: {},
      },
    },
  });

  app.use("/api", generalLimit);
  app.get("/api/health", (_req, res) =>
    ok(res, { status: mongoose.connection.readyState === 1 ? "ready" : "starting" }),
  );
  app.use("/api/auth", authLimit, authRouter);
  app.use("/api/plans", plansRouter);
  app.use("/api/subscriptions/payment", paymentLimit);
  app.use("/api/subscriptions", subscriptionsRouter);
  app.use("/api/stores", storesRouter);
  app.use("/api/artworks", artworksRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/messages", messageLimit, messagesRouter);
  app.use("/api", commerceRouter);
  app.use("/api", operationsRouter);
  app.use("/api/gallery", galleryRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/bootstrap", bootstrapRouter);
  if (env.UPLOAD_PROVIDER === "local") {
    app.use(
      "/uploads",
      express.static(path.resolve(process.cwd(), env.UPLOAD_DIR, "public"), {
        fallthrough: false,
        index: false,
        dotfiles: "deny",
        maxAge: env.NODE_ENV === "production" ? "1y" : 0,
      }),
    );
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
