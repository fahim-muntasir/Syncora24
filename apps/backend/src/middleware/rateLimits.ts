import { Request } from "express";
import { rateLimitConfig as config } from "../lib/rateLimitConfig";
import { createHttpRateLimit, getClientIp } from "./rateLimit";

const policy = (
  scope: string,
  identity: string,
  limit: number,
  windowMs: number,
) => ({ scope, identity, limit, windowMs });

const signInEmailIdentity = (req: Request): string | undefined => {
  if (
    typeof req.body !== "object" ||
    req.body === null ||
    !("email" in req.body) ||
    typeof req.body.email !== "string" ||
    req.body.email.length > 320
  ) {
    return undefined;
  }
  return req.body.email.trim().toLowerCase();
};

export const signInRateLimit = createHttpRateLimit({
  policies: (req) => {
    const ip = getClientIp(req);
    const email = signInEmailIdentity(req);
    return [
      policy("http-signin-ip", ip, config.signInIpLimit, config.signInWindowMs),
      ...(email
        ? [
            policy(
              "http-signin-ip-account",
              `${ip}:${email}`,
              config.signInIdentityIpLimit,
              config.signInWindowMs,
            ),
            policy(
              "http-signin-account",
              email,
              config.signInAccountLimit,
              config.signInWindowMs,
            ),
          ]
        : []),
    ];
  },
});

export const signUpRateLimit = createHttpRateLimit({
  policies: (req) => [
    policy(
      "http-signup-ip",
      getClientIp(req),
      config.signUpIpLimit,
      config.signUpWindowMs,
    ),
  ],
});

export const refreshRateLimit = createHttpRateLimit({
  policies: (req) => [
    policy(
      "http-refresh-ip",
      getClientIp(req),
      config.refreshIpLimit,
      config.refreshWindowMs,
    ),
  ],
});

export const createRoomRateLimit = createHttpRateLimit({
  policies: (req) => [
    policy(
      "http-create-room-user",
      req.user?.id ?? getClientIp(req),
      config.createRoomUserLimit,
      config.createRoomWindowMs,
    ),
    policy(
      "http-create-room-ip",
      getClientIp(req),
      config.createRoomIpLimit,
      config.createRoomWindowMs,
    ),
  ],
});

export const roomMutationRateLimit = createHttpRateLimit({
  policies: (req) => [
    policy(
      "http-room-mutation-user",
      req.user?.id ?? getClientIp(req),
      config.roomMutationUserLimit,
      config.roomMutationWindowMs,
    ),
  ],
});

export const httpChatRateLimit = createHttpRateLimit({
  policies: (req) => [
    policy(
      "http-chat-user",
      req.user?.id ?? getClientIp(req),
      config.httpChatUserLimit,
      config.httpChatWindowMs,
    ),
  ],
});
