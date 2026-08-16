import redis from "../../redis";

export const endRoom = async (roomId: string) => {
  const roomKey = `room:${roomId}`;

  await redis.call(
    "JSON.SET",
    roomKey,
    "$.status",
    JSON.stringify("ended"),
  );

  await redis.del(`room:${roomId}:force-muted`);
  await redis.del(`room:${roomId}:mute-all`);

  return true;
};