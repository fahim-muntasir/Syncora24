import redis from "../../redis";
import { findSingleItem } from "../room";

export const getRoomModerationState = async (roomId: string) => {
  const forceMutedUsers = await redis.smembers(`room:${roomId}:force-muted`);
  const moderatorIds = await redis.smembers(`room:${roomId}:moderators`);
  const kickedMemberIds = await redis.smembers(`room:${roomId}:kicked-members`);

  const muteAll = (await redis.get(`room:${roomId}:mute-all`)) === "1";

  const room = await findSingleItem(roomId);

  const muteAllExcludedUsers = room ? [room.hostId] : [];

  return {
    forceMutedUsers,
    muteAll,
    muteAllExcludedUsers,
    moderatorIds,
    kickedMemberIds,
  };
};
