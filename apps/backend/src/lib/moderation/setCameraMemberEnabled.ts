import redis from "../../redis";

export const setCameraMemberEnabled = async (
  roomId: string,
  memberId: string,
  enabled: boolean,
) => {
  const key = `room:${roomId}:camera-disabled`;
  const allowedKey = `room:${roomId}:camera-allowed`;
  if (enabled) {
    await redis.srem(key, memberId);
    await redis.sadd(allowedKey, memberId);
  } else {
    await redis.sadd(key, memberId);
    await redis.srem(allowedKey, memberId);
  }
  return enabled;
};
