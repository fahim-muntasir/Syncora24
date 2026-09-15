import redis from "../redis";

async function canModerateRoom(
  roomId: string,
  userId: string
): Promise<boolean> {

  const roomJson = await redis.call("JSON.GET", `room:${roomId}`, "$");

  if (!roomJson || roomJson === "null") {
    return false;
  }

  const room = JSON.parse(roomJson as string)[0];
  if (room.hostId === userId) {
    return true;
  }

  return (await redis.sismember(`room:${roomId}:moderators`, userId)) === 1;
}

export { canModerateRoom };