import redis from "../../redis";

export const setCameraEnabled = async (roomId: string, enabled: boolean) => {
  await redis.set(`room:${roomId}:camera-enabled`, enabled ? "1" : "0");
  if (enabled) {
    await redis.del(`room:${roomId}:camera-disabled`);
    await redis.del(`room:${roomId}:camera-allowed`);
  }
  return enabled;
};
