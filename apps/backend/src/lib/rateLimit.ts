import { createHash } from "crypto";

export interface RateLimitPolicy {
  scope: string;
  identity: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimitStore {
  consume(policies: RateLimitPolicy[]): Promise<RateLimitResult>;
}

interface RedisEvalClient {
  eval(script: string, numberOfKeys: number, ...args: string[]): Promise<unknown>;
}

export const fixedWindowRateLimitScript = `
local count = #KEYS
local blocked = false
local retryAfter = 0
local remaining = math.huge

for index = 1, count do
  local limit = tonumber(ARGV[(index - 1) * 2 + 1])
  local window = tonumber(ARGV[(index - 1) * 2 + 2])
  local current = tonumber(redis.call("GET", KEYS[index])) or 0
  local ttl = redis.call("PTTL", KEYS[index])
  if ttl < 0 then
    ttl = window
    if current > 0 then
      redis.call("PEXPIRE", KEYS[index], window)
    end
  end

  remaining = math.min(remaining, math.max(0, limit - current))
  if current >= limit then
    blocked = true
    retryAfter = math.max(retryAfter, ttl)
  end
end

if blocked then
  return {0, retryAfter, remaining}
end

for index = 1, count do
  local limit = tonumber(ARGV[(index - 1) * 2 + 1])
  local window = tonumber(ARGV[(index - 1) * 2 + 2])
  local current = redis.call("INCR", KEYS[index])
  if current == 1 or redis.call("PTTL", KEYS[index]) < 0 then
    redis.call("PEXPIRE", KEYS[index], window)
  end
  remaining = math.min(remaining, math.max(0, limit - current))
end

return {1, 0, remaining}
`;

const digest = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const getRateLimitKeys = (policies: RateLimitPolicy[]): string[] =>
  policies.map(({ scope, identity }) => {
    if (!/^[a-z0-9:_-]{1,80}$/i.test(scope)) {
      throw new Error("Invalid rate-limit scope.");
    }
    if (!identity || identity.length > 2048) {
      throw new Error("Invalid rate-limit identity.");
    }
    return `syncora:{ratelimit}:v1:${scope}:${digest(identity)}`;
  });

const parseScriptResult = (value: unknown): RateLimitResult => {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    typeof value[2] !== "number"
  ) {
    throw new Error("Invalid response from Redis rate limiter.");
  }

  return {
    allowed: value[0] === 1,
    retryAfterMs: Math.max(0, value[1]),
    remaining: Math.max(0, value[2]),
  };
};

export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly client: RedisEvalClient) {}

  async consume(policies: RateLimitPolicy[]): Promise<RateLimitResult> {
    if (policies.length === 0) {
      throw new Error("At least one rate-limit policy is required.");
    }
    for (const policy of policies) {
      if (
        !Number.isSafeInteger(policy.limit) ||
        policy.limit < 1 ||
        policy.limit > 1_000_000 ||
        !Number.isSafeInteger(policy.windowMs) ||
        policy.windowMs < 1 ||
        policy.windowMs > 30 * 24 * 60 * 60 * 1000
      ) {
        throw new Error("Rate-limit limits and windows must be positive integers.");
      }
    }

    const keys = getRateLimitKeys(policies);
    const args = policies.flatMap((policy) => [
      String(policy.limit),
      String(policy.windowMs),
    ]);
    const result = await this.client.eval(
      fixedWindowRateLimitScript,
      keys.length,
      ...keys,
      ...args,
    );

    return parseScriptResult(result);
  }
}

export const rateLimitStore: RateLimitStore = {
  consume: async (policies) => {
    const redis = (await import("../redis")).default;
    return new RedisRateLimitStore(redis).consume(policies);
  },
};

export const hashRateLimitIdentity = digest;
