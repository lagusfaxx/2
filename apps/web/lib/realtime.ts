"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectRealtime = (userId: string) => {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
    query: { userId }
  });
  return socket;
};

export const useSocket = () => socket;
