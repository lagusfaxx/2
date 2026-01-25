import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import cookieParser from "cookie-parser";

// 👇 IMPORTANTE: ajusta estos imports según tu repo si tienen nombres distintos
import { configureHelmet } from "./lib/helmet"; // si existe en tu proyecto
import { attachSession } from "./middleware/session"; // si existe en tu proyecto
import authRoutes from "./auth/routes";
import feedRoutes from "./feed/routes";
import creatorRoutes from "./creator/routes";
import profileRoutes from "./profile/routes";
import messagesRoutes from "./messages/routes";
import notificationsRoutes from "./notifications/routes";
import billingRoutes from "./billing/routes";

const app = express();

/**
 * ============================
 * 1) CORS + PARSERS
 * ============================
 */
app.use(
  cors({
    origin: ["https://uzeed.cl", "https://www.uzeed.cl", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
    exposedHeaders: ["Accept-Ranges", "Content-Range", "Content-Length"],
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

/**
 * ============================
 * 2) HELMET (si tu proyecto lo usa)
 * ============================
 * Si no tienes configureHelmet, simplemente borra esta sección.
 */
try {
  configureHelmet(app);
} catch {}

/**
 * ============================
 * ✅ 3) UPLOADS PÚBLICO (FIX REAL)
 * ============================
 * Esto debe ir ANTES de cualquier middleware que exija sesión/auth.
 *
 * Si tu carpeta de uploads está en otro lugar, ajusta UPLOAD_DIR.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ✅ IMPORTANTE: público, sin requireAuth
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    fallthrough: true,
    setHeaders: (res) => {
      // Permite que uzeed.cl pueda cargar video/img desde api.uzeed.cl
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

      // Esto ayuda a iOS Safari cuando hay media cross-domain
      res.setHeader("Access-Control-Allow-Origin", "https://uzeed.cl");
      res.setHeader("Access-Control-Allow-Credentials", "true");

      // iOS necesita Range para video
      res.setHeader("Accept-Ranges", "bytes");

      // Evita que Cloudflare o navegadores hagan cosas raras con tipo
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

/**
 * ============================
 * 4) SESSION MIDDLEWARE (después de uploads)
 * ============================
 * Si tu proyecto no tiene attachSession, elimina esto.
 */
try {
  app.use(attachSession());
} catch {}

/**
 * ============================
 * 5) ROUTES
 * ============================
 */
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/feed", feedRoutes);
app.use("/creator", creatorRoutes);
app.use("/profile", profileRoutes);
app.use("/messages", messagesRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/billing", billingRoutes);

/**
 * ============================
 * 6) 404 FALLBACK
 * ============================
 */
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
