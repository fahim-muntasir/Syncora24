import { findSingleItem } from "../lib/room";

async function canModerateRoom(
  roomId: string,
  userId: string
): Promise<boolean> {

  const room = await findSingleItem(roomId);

  if (!room) {
    return false;
  }

  if (room.hostId === userId) {
    return true;
  }

  return room.moderatorIds.includes(userId);
}

export { canModerateRoom };