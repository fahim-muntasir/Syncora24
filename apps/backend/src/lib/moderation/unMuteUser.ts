import redis from "../../redis";

export const unmuteUser = async (
  roomId: string,
  targetUserId: string,
) => {
  await redis.srem(
    `room:${roomId}:force-muted`,
    targetUserId,
  );

  return {
    roomId,
    userId: targetUserId,
    forceMuted: false,
  };
};