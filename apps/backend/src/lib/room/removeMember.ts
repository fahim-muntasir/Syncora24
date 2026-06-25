import redis from "../../redis";
import createHttpError from "http-errors";

type RemoveMemberParams = {
  roomId: string;
  memberId: string;
};

export const removeMember = async ({
  roomId,
  memberId,
}: RemoveMemberParams) => {
  try {
    const roomKey = `room:${roomId}`;

    // Fetch full room data
    const roomJson = await redis.call("JSON.GET", roomKey, "$");
    if (!roomJson || roomJson === "null") {
      throw createHttpError(404, "Room not found");
    }

    const [roomData] = JSON.parse(roomJson as string);

    const currentMembers = roomData.members || [];

    // Find index of member to remove
    const index = currentMembers.findIndex((m: any) => m.id === memberId);

    if (index === -1) {
      return;
      // throw createHttpError(404, "Member not found in the room");
    }

    // Remove the member using JSON.DEL at array index
    await redis.call("JSON.DEL", roomKey, `$.members[${index}]`);

    // Get updated members array
    const updatedJson = await redis.call("JSON.GET", roomKey, "$.members");

    if (updatedJson) {
      const [membersArray] = JSON.parse(updatedJson as string);

      if (!membersArray || membersArray.length === 0) {
        await redis.expire(roomKey, 1 * 60 * 60); // 1 hour
      }
    }

    return index;
  } catch (error) {
    console.error("Error in lib/room/removeMember:", error);
    throw error;
  }
};
