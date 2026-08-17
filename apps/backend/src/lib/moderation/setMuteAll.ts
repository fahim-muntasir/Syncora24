import redis from "../../redis";

export const setMuteAll = async (
  roomId: string,
  muteAll: boolean,
) => {
  const key = `room:${roomId}:mute-all`;

  if (muteAll) {
    await redis.set(key, "1");
  } else {
    await redis.del(key);
  }

  return muteAll;
};