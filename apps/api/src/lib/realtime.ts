import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export const registerRealtime = (server: IOServer) => {
  io = server;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};
