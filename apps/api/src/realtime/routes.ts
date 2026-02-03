import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { asyncHandler } from "../lib/asyncHandler";
import { emitRealtimeEvent, getActiveConnections, registerRealtimeClient } from "./server";

export const realtimeRouter = Router();

realtimeRouter.get("/realtime/stream", requireAuth, asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const userId = req.session.userId!;
  const activeCount = getActiveConnections(userId);
  registerRealtimeClient(userId, res);

  if (activeCount === 0) {
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
    emitRealtimeEvent({
      type: "presence:update",
      payload: { userId, isOnline: true }
    });
  }

  res.write("event: connected\n");
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write("event: heartbeat\n");
    res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  }, 25000);

  req.on("close", async () => {
    clearInterval(heartbeat);
    const remaining = getActiveConnections(userId);
    if (remaining === 0) {
      await prisma.user.update({ where: { id: userId }, data: { isOnline: false } });
      emitRealtimeEvent({
        type: "presence:update",
        payload: { userId, isOnline: false }
      });
    }
  });
}));
