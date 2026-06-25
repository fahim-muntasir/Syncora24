// lib/socket.ts (or any central location)
import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL =
  process.env.NODE_ENV === "production"
    ? undefined
    : process.env.NEXT_PUBLIC_API_URL;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });
  }
  return socket;
};
