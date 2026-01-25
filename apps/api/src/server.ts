import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { stat } from "node:fs/promises";

import { env, assertEnv } from "./lib/env";
import { configureSession } from "./lib/session";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { feedRouter } from "./routes/feed";
import { adminRouter } from "./routes/admin";
import { paymentsRouter } from "./routes/payments";
import { webhooksRouter } from "./routes/webhooks";

assertEnv();

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan("combined"));
const allowedOrigins = env.WEB_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120
  })
);

configureSession(app);

// Webhooks need raw body for signature
app.use("/webhooks", express.raw({ type: "application/json" }));
app.use("/webhooks", webhooksRouter);

// Normal JSON for app
app.use(express.json({ limit: "2mb" }));

// Serve uploaded files (local provider) with iOS-safe streaming (Range/206)
const uploadsPath = path.join(process.cwd(), env.UPLOADS_DIR);

function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".m4v") return "video/x-m4v";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

app.get("/uploads/*", async (req, res, next) => {
  try {
    const raw = req.path.replace(/^\/uploads\//, "");
    const decoded = decodeURIComponent(raw);
    const safe = path.normalize(decoded).replace(/^([.][\/\\])+/, "");
    if (!safe || safe.includes("..")) return res.status(400).end();

    const filePath = path.join(uploadsPath, safe);
    if (!filePath.startsWith(uploadsPath)) return res.status(400).end();

    const st = await stat(filePath);
    if (!st.isFile()) return res.status(404).end();

    // Cloudflare + iOS Safari compatibility
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Avoid Cloudflare cache weirdness for partials unless you explicitly want caching
    res.setHeader("Cache-Control", "public, max-age=3600");

    const type = contentTypeFor(filePath);
    const range = req.headers.range;

    if (range) {
      const m = /^bytes=(\d+)-(\d+)?$/.exec(range);
      if (!m) {
        res.status(416).setHeader("Content-Range", `bytes */${st.size}`).end();
        return;
      }
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : st.size - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= st.size) {
        res.status(416).setHeader("Content-Range", `bytes */${st.size}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader("Content-Type", type);
      res.setHeader("Content-Length", chunkSize);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${st.size}`);

      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Length", st.size);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(authRouter);
app.use(meRouter);
app.use(feedRouter);
app.use(paymentsRouter);
app.use(adminRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

app.listen(env.PORT, () => {
  console.log(`UZEED API listening on :${env.PORT}`);
});
