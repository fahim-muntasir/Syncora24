import redis from "../../redis";

export const muteUser = async (
  roomId: string,
  targetUserId: string,
) => {
  await redis.sadd(
    `room:${roomId}:force-muted`,
    targetUserId,
  );

  return {
    roomId,
    userId: targetUserId,
    forceMuted: true,
  };
};