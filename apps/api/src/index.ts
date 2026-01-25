import "dotenv/config";
import express from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import session from "express-session";
import pg from "pg";
import PgSession from "connect-pg-simple";
import path from "path";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import { config } from "./config";
import { authRouter } from "./auth/routes";
import { ensureAdminUser } from "./auth/seedAdmin";
import { feedRouter } from "./feed/routes";
import { adminRouter } from "./admin/routes";
import { khipuRouter } from "./khipu/routes";
import { profileRouter } from "./profile/routes";
import { servicesRouter } from "./services/routes";
import { messagesRouter } from "./messages/routes";
import { creatorRouter } from "./creator/routes";
import { billingRouter } from "./billing/routes";
import { notificationsRouter } from "./notifications/routes";
import { KhipuError } from "./khipu/client";
import { statsRouter } from "./stats/routes";
import { prisma } from "./db";

const app = express();

// IMPORTANTE para Coolify/Cloudflare/Proxies (cookies + https)
app.set("trust proxy", 1);

// Seguridad headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// CORS
const corsOrigins = Array.from(
  new Set([
    "https://uzeed.cl",
    "https://www.uzeed.cl",
    ...config.corsOrigin
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  ])
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS_NOT_ALLOWED"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
  exposedHeaders: ["X-Request-Id", "Accept-Ranges", "Content-Range", "Content-Length"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rate limit
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(cookieParser());

// Request ID
app.use((req, res, next) => {
  const requestId = req.header("x-request-id") || randomUUID();
  (req as any).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

// JSON body, excepto webhooks Khipu (raw body)
app.use((req, res, next) => {
  if (req.path.startsWith("/webhooks/khipu")) {
    express.raw({ type: "application/json" })(req, res, (err) => {
      if (err) return next(err);
      (req as any).rawBody = req.body;
      try {
        req.body = JSON.parse((req.body as Buffer).toString("utf8"));
      } catch {
        req.body = {};
      }
      return next();
    });
  } else {
    express.json({ limit: "50mb" })(req, res, next);
  }
});

/**
 * ✅ UPLOADS PÚBLICOS (ANTES DE SESSION)
 * - No requiere cookies
 * - Permite Range requests (iOS/Android + Cloudflare)
 * - CORS solo en allowlist
 */
app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;

    if (origin && corsOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }

    // Para media: NO credenciales
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Request-Id");
    res.setHeader("Access-Control-Expose-Headers", "Accept-Ranges, Content-Range, Content-Length");

    // Para que el navegador permita usar el recurso cross-site
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    // Range requests
    res.setHeader("Accept-Ranges", "bytes");

    // Responder preflight rápido
    if (req.method === "OPTIONS") return res.sendStatus(204);

    next();
  },
  express.static(path.resolve(config.storageDir), {
    maxAge: "1h",
    setHeaders: (res) => {
      // Range siempre disponible (videos)
      res.setHeader("Accept-Ranges", "bytes");
      // Evita transformaciones raras en proxies
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  })
);

// Session (DESPUÉS de uploads para que uploads jamás dependa de auth/cookies)
const pgPool = new pg.Pool({ connectionString: config.databaseUrl });
const PgStore = PgSession(session);

app.use(
  session({
    name: "uzeed_session",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.env !== "development",
      domain: config.cookieDomain,
      maxAge: 1000 * 60 * 60 * 24 * 30
    },
    store: new PgStore({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true
    })
  })
);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "DB_NOT_READY" });
  }
});
app.get("/version", (_req, res) =>
  res.json({ sha: process.env.GIT_SHA || "unknown", env: config.env })
);

// Routes
app.use("/auth", authRouter);
app.use("/", feedRouter);
app.use("/admin", adminRouter);
app.use("/", khipuRouter);
app.use("/", profileRouter);
app.use("/", servicesRouter);
app.use("/", messagesRouter);
app.use("/", creatorRouter);
app.use("/", billingRouter);
app.use("/", notificationsRouter);
app.use("/", statsRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = (req as any).requestId;

  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      route: req.originalUrl,
      message: err?.message || "Unknown error",
      code: err?.code
    })
  );

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021" || err.code === "P2022") {
      return res.status(500).json({ error: "DB_SCHEMA_MISMATCH" });
    }
  }

  if (err instanceof KhipuError) {
    const hint =
      err.status === 404
        ? "Khipu devolvió 404. Revisa KHIPU_BASE_URL (prod vs sandbox) y que apunte a la API correcta."
        : undefined;
    return res.status(502).json({ error: "KHIPU_ERROR", status: err.status, message: err.message, hint });
  }

  if (typeof err?.message === "string" && err.message.startsWith("Khipu")) {
    return res.status(502).json({ error: "KHIPU_ERROR" });
  }

  if (err?.message === "CORS_NOT_ALLOWED") {
    return res.status(403).json({ error: "CORS_NOT_ALLOWED" });
  }

  if (err?.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: "INVALID_FILE_TYPE" });
  }

  if (err?.message === "FILE_TOO_LARGE" || err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "FILE_TOO_LARGE" });
  }

  return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

// Boot
const port = config.port || 3001;

async function boot() {
  try {
    // opcional: si quieres forzar seed admin
    // await ensureAdminUser();

    app.listen(port, () => {
      console.log(`[api] listening on :${port} env=${config.env}`);
      console.log(`[api] uploads dir: ${path.resolve(config.storageDir)}`);
    });
  } catch (err) {
    console.error("[api] boot failed", err);
    process.exit(1);
  }
}

boot();
