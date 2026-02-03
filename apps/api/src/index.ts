import "dotenv/config";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server as IOServer } from "socket.io";
import { env } from "./lib/env";
import { registerRealtime } from "./lib/realtime";
import authRoutes from "./routes/auth";
import directoryRoutes from "./routes/directory";
import profileRoutes from "./routes/profile";
import messageRoutes from "./routes/messages";
import serviceRoutes from "./routes/services";
import favoriteRoutes from "./routes/favorites";
import ratingRoutes from "./routes/ratings";
import adminRoutes from "./routes/admin";
import billingRoutes from "./routes/billing";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const origins = env.CORS_ORIGINS?.split(",") ?? [env.WEB_URL];
app.use(cors({ origin: origins, credentials: true }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/directory", directoryRoutes);
app.use("/profiles", profileRoutes);
app.use("/messages", messageRoutes);
app.use("/services", serviceRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/ratings", ratingRoutes);
app.use("/admin", adminRoutes);
app.use("/billing", billingRoutes);

const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: origins,
    credentials: true
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string | undefined;
  if (userId) {
    socket.join(`user:${userId}`);
    socket.broadcast.emit("presence", { userId, status: "online" });
    socket.on("disconnect", () => {
      socket.broadcast.emit("presence", { userId, status: "offline" });
    });
  }
});

registerRealtime(io);

server.listen(3001, () => {
  console.log("API running on :3001");
});
