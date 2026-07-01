import dotenv from "dotenv";
dotenv.config();

import Redis, { RedisOptions } from "ioredis";

const redisOptions: string | RedisOptions = process.env.NODE_ENV === "production" && process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      // password: process.env.REDIS_PASSWORD, // if needed
    };

const redis = typeof redisOptions === "string"
  ? new Redis(redisOptions)
  : new Redis(redisOptions);


redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redis;