import "socket.io";
import type { UserType } from "./user";

declare module "socket.io" {
  interface SocketData {
    user: UserType;
    roomId?: string;
    userId?: string;
    userName?: string;
    socketId?: string;
    isScreenSharing?: boolean;
    screenShareStreamId?: string;
  }
}
