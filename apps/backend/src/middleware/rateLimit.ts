import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/responseHelper";
import {
  RateLimitPolicy,
  RateLimitStore,
  rateLimitStore,
} from "../lib/rateLimit";

export type RateLimitFailurePolicy = "closed" | "open";

interface HttpRateLimitOptions {
  policies: (req: Request) => RateLimitPolicy[];
  store?: RateLimitStore;
  failurePolicy?: RateLimitFailurePolicy;
}

export const getClientIp = (req: Request): string =>
  req.ip || req.socket.remoteAddress || "unknown";

export const createHttpRateLimit = ({
  policies,
  store = rateLimitStore,
  failurePolicy = "closed",
}: HttpRateLimitOptions) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activePolicies = policies(req);
      const result = await store.consume(activePolicies);
      const limit = Math.min(...activePolicies.map((policy) => policy.limit));
      res.setHeader("RateLimit-Limit", String(limit));
      res.setHeader("RateLimit-Remaining", String(result.remaining));
      if (result.allowed) {
        next();
        return;
      }

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(result.retryAfterMs / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader(
        "RateLimit-Reset",
        String(Math.ceil(Date.now() / 1000) + retryAfterSeconds),
      );
      errorResponse(res, "Too many requests. Please try again later.", 429);
    } catch (error) {
      console.error("[RateLimit] Redis check failed:", error);
      if (failurePolicy === "open") {
        next();
        return;
      }

      res.setHeader("Retry-After", "1");
      errorResponse(
        res,
        "Request protection is temporarily unavailable. Please retry shortly.",
        503,
      );
    }
  };
