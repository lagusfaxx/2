import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import cookieParser from "cookie-parser";

// ⚠️ Ajusta estos imports si en tu repo tienen nombres distintos
import authRoutes from "./auth/routes";
import feedRoutes from "./feed/routes";
import profileRoutes from "./profile/routes";
import creatorRoutes from "./creator/routes";
import messagesRoutes from "./messages/routes";
import notificationsRoutes from "./notifications/routes";
import billingRoutes from "./billing/routes";

// Si tienes middlewares propios (helmet/session), mantenlos pero DESPUÉS de /uploads
// @ts-ignore
import { configureHelmet } from "./lib/helmet";
// @ts-ignore
import { attachSession } from "./middleware/session";

const app = express();

/**
 * =========================================================
 * 1) CORS
 * =========================================================
 */
app.use(
  cors({
    origin: [
      "https://uzeed.cl",
      "https://www.uzeed.cl",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
    ],
    exposedHeaders: ["Accept-Ranges", "Content-Range", "Content-Length"],
  })
);

/**
 * =========================================================
 * 2) BODY + COOKIES
 * =========================================================
 */
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

/**
 * =========================================================
 * ✅ 3) UPLOADS PUBLICO (FIX FINAL)
 * =========================================================
 * IMPORTANTE: Esto DEBE ir ANTES de cualquier sesión/auth.
 * Porque tu CURL mostraba: /uploads/*.mp4 -> 401 (JSON)
 * iPhone NO reproduce si /uploads requiere cookies.
 */
const UPLOADS_DIR = process.env.UPLOADS_DIR || "uploads";
const UPLOADS_PATH = path.join(process.cwd(), UPLOADS_DIR);

if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

// Handler público para static files
app.use(
  "/uploads",
  express.static(UPLOADS_PATH, {
    fallthrough: true,
    setHeaders: (res) => {
      // Permitir que la web (uzeed.cl) cargue videos/imagenes desde api.uzeed.cl
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "https://uzeed.cl");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

/**
 * =========================================================
 * ✅ 4) STREAMING RANGE (206) PARA iOS SAFARI
 * =========================================================
 * iOS suele pedir Range: bytes=0-
 * express.static a veces funciona, pero con proxies/CF puede fallar.
 * Este endpoint asegura 206 + Content-Range para .mp4 cuando llega Range.
 */
app.get("/uploads/:file", (req, res, next) => {
  const file = req.params.file;

  // solo para videos mp4 (puedes ampliar si quieres)
  if (!file.toLowerCase().endsWith(".mp4")) return next();

  const filePath = path.join(UPLOADS_PATH, file);
  if (!fs.existsSync(filePath)) return res.status(404).end();

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Headers básicos
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "https://uzeed.cl");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Si no viene Range, servir completo
  if (!range) {
    res.setHeader("Content-Length", fileSize);
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Parse Range: bytes=start-end
  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  // Validación básica
  if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
    res.status(416).setHeader("Content-Range", `bytes */${fileSize}`).end();
    return;
  }

  const chunkSize = end - start + 1;

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
  res.setHeader("Content-Length", chunkSize);

  fs.createReadStream(filePath, { start, end }).pipe(res);
});

/**
 * =========================================================
 * 5) HELMET / SESSION (DESPUES DE UPLOADS!)
 * =========================================================
 * Si tu repo no tiene configureHelmet o attachSession, puedes borrar try/catch.
 */
try {
  configureHelmet(app);
} catch {}

try {
  app.use(attachSession());
} catch {}

/**
 * =========================================================
 * 6) ROUTES
 * =========================================================
 */
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/feed", feedRoutes);
app.use("/profile", profileRoutes);
app.use("/creator", creatorRoutes);
app.use("/messages", messagesRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/billing", billingRoutes);

/**
 * =========================================================
 * 7) 404
 * =========================================================
 */
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});
