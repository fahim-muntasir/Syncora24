const positiveInteger = (name: string, defaultValue: number): number => {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === "") return defaultValue;
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} must be a positive integer.`);
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
};

const config = {
  signInIpLimit: positiveInteger("RATE_LIMIT_SIGNIN_IP_MAX", 40),
  signInIdentityIpLimit: positiveInteger("RATE_LIMIT_SIGNIN_IDENTITY_IP_MAX", 8),
  signInAccountLimit: positiveInteger("RATE_LIMIT_SIGNIN_ACCOUNT_MAX", 20),
  signInWindowMs: positiveInteger("RATE_LIMIT_SIGNIN_WINDOW_MS", 15 * 60_000),
  signUpIpLimit: positiveInteger("RATE_LIMIT_SIGNUP_IP_MAX", 12),
  signUpWindowMs: positiveInteger("RATE_LIMIT_SIGNUP_WINDOW_MS", 60 * 60_000),
  refreshIpLimit: positiveInteger("RATE_LIMIT_REFRESH_IP_MAX", 60),
  refreshWindowMs: positiveInteger("RATE_LIMIT_REFRESH_WINDOW_MS", 5 * 60_000),
  createRoomUserLimit: positiveInteger("RATE_LIMIT_CREATE_ROOM_USER_MAX", 8),
  createRoomIpLimit: positiveInteger("RATE_LIMIT_CREATE_ROOM_IP_MAX", 30),
  createRoomWindowMs: positiveInteger("RATE_LIMIT_CREATE_ROOM_WINDOW_MS", 60 * 60_000),
  roomMutationUserLimit: positiveInteger("RATE_LIMIT_ROOM_MUTATION_USER_MAX", 30),
  roomMutationWindowMs: positiveInteger("RATE_LIMIT_ROOM_MUTATION_WINDOW_MS", 60_000),
  httpChatUserLimit: positiveInteger("RATE_LIMIT_HTTP_CHAT_USER_MAX", 20),
  httpChatWindowMs: positiveInteger("RATE_LIMIT_HTTP_CHAT_WINDOW_MS", 60_000),
  socketChatRoomLimit: positiveInteger("RATE_LIMIT_SOCKET_CHAT_ROOM_MAX", 8),
  socketChatRoomWindowMs: positiveInteger("RATE_LIMIT_SOCKET_CHAT_ROOM_WINDOW_MS", 10_000),
  socketChatUserLimit: positiveInteger("RATE_LIMIT_SOCKET_CHAT_USER_MAX", 30),
  socketChatUserWindowMs: positiveInteger("RATE_LIMIT_SOCKET_CHAT_USER_WINDOW_MS", 30_000),
  socketModerationLimit: positiveInteger("RATE_LIMIT_SOCKET_MODERATION_MAX", 20),
  socketModerationWindowMs: positiveInteger("RATE_LIMIT_SOCKET_MODERATION_WINDOW_MS", 60_000),
  socketModerationUserLimit: positiveInteger("RATE_LIMIT_SOCKET_MODERATION_USER_MAX", 60),
  socketModerationUserWindowMs: positiveInteger("RATE_LIMIT_SOCKET_MODERATION_USER_WINDOW_MS", 60_000),
  socketRoomJoinLimit: positiveInteger("RATE_LIMIT_SOCKET_ROOM_JOIN_MAX", 60),
  socketRoomJoinWindowMs: positiveInteger("RATE_LIMIT_SOCKET_ROOM_JOIN_WINDOW_MS", 60_000),
  socketRoomJoinUserLimit: positiveInteger("RATE_LIMIT_SOCKET_ROOM_JOIN_USER_MAX", 120),
  socketRoomJoinUserWindowMs: positiveInteger("RATE_LIMIT_SOCKET_ROOM_JOIN_USER_WINDOW_MS", 60_000),
  socketSpeakingLimit: positiveInteger("RATE_LIMIT_SOCKET_SPEAKING_MAX", 20),
  socketSpeakingWindowMs: positiveInteger("RATE_LIMIT_SOCKET_SPEAKING_WINDOW_MS", 1_000),
  socketMediaStateLimit: positiveInteger("RATE_LIMIT_SOCKET_MEDIA_STATE_MAX", 30),
  socketMediaStateWindowMs: positiveInteger("RATE_LIMIT_SOCKET_MEDIA_STATE_WINDOW_MS", 10_000),
};

for (const [name, value] of Object.entries(config)) {
  const maximum = name.endsWith("WindowMs")
    ? 30 * 24 * 60 * 60 * 1000
    : 1_000_000;
  if (value > maximum) {
    throw new Error(`${name} must not exceed ${maximum}.`);
  }
}

export const rateLimitConfig = config;
