import type { Socket } from "socket.io";
import {
  RateLimitPolicy,
  RateLimitStore,
  rateLimitStore,
} from "../lib/rateLimit";
import { rateLimitConfig as config } from "../lib/rateLimitConfig";

export type SocketRateLimitFailurePolicy = "closed" | "open";

export const socketRatePolicies = {
  chat: (userId: string, roomId: string): RateLimitPolicy[] => [
    {
      scope: "socket-chat-room",
      identity: `${userId}:${roomId}`,
      limit: config.socketChatRoomLimit,
      windowMs: config.socketChatRoomWindowMs,
    },
    {
      scope: "socket-chat-user",
      identity: userId,
      limit: config.socketChatUserLimit,
      windowMs: config.socketChatUserWindowMs,
    },
  ],
  roomJoin: (userId: string, roomId: string): RateLimitPolicy[] => [
    {
      scope: "socket-room-join",
      identity: `${userId}:${roomId}`,
      limit: config.socketRoomJoinLimit,
      windowMs: config.socketRoomJoinWindowMs,
    },
    {
      scope: "socket-room-join-user",
      identity: userId,
      limit: config.socketRoomJoinUserLimit,
      windowMs: config.socketRoomJoinUserWindowMs,
    },
  ],
  speaking: (userId: string, roomId: string): RateLimitPolicy[] => [
    {
      scope: "socket-speaking",
      identity: `${userId}:${roomId}`,
      limit: config.socketSpeakingLimit,
      windowMs: config.socketSpeakingWindowMs,
    },
  ],
  mediaState: (userId: string, roomId: string): RateLimitPolicy[] => [
    {
      scope: "socket-media-state",
      identity: `${userId}:${roomId}`,
      limit: config.socketMediaStateLimit,
      windowMs: config.socketMediaStateWindowMs,
    },
  ],
  moderation: (userId: string, roomId: string): RateLimitPolicy[] => [
    {
      scope: "socket-moderation",
      identity: `${userId}:${roomId}`,
      limit: config.socketModerationLimit,
      windowMs: config.socketModerationWindowMs,
    },
    {
      scope: "socket-moderation-user",
      identity: userId,
      limit: config.socketModerationUserLimit,
      windowMs: config.socketModerationUserWindowMs,
    },
  ],
};

interface SocketRateLimitResponse {
  success: false;
  message: string;
  retryAfterMs?: number;
}

export const enforceSocketRateLimit = async (
  socket: Pick<Socket, "emit">,
  event: string,
  policies: RateLimitPolicy[],
  failurePolicy: SocketRateLimitFailurePolicy = "closed",
  callback?: (response: SocketRateLimitResponse) => void,
  errorEvent = "socket-rate-limit-error",
  store: RateLimitStore = rateLimitStore,
): Promise<boolean> => {
  try {
    const result = await store.consume(policies);
    if (result.allowed) return true;

    const response = {
      success: false as const,
      message: "Too many actions. Please slow down and retry.",
      retryAfterMs: result.retryAfterMs,
    };
    callback?.(response);
    socket.emit(errorEvent, { event, retryAfterMs: result.retryAfterMs });
    return false;
  } catch (error) {
    console.error(`[SocketRateLimit] Redis check failed for ${event}:`, error);
    if (failurePolicy === "open") return true;

    const response = {
      success: false as const,
      message: "Action protection is temporarily unavailable. Please retry.",
      retryAfterMs: 1000,
    };
    callback?.(response);
    socket.emit(errorEvent, { event, retryAfterMs: 1000 });
    return false;
  }
};
