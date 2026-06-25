import redis from "../../redis";
import createHttpError from "http-errors";

type RoomMember = {
  id?: string;
  name?: string;
  avatar?: string;
};

type AddMemberParams = {
  roomId: string;
  member: RoomMember;
};

export const addMember = async ({ roomId, member }: AddMemberParams) => {
  try {
    const roomKey = `room:${roomId}`;

    // Fetch full room data
    const roomJson = await redis.call("JSON.GET", roomKey, "$");
    if (!roomJson || roomJson === "null") {
      throw createHttpError(404, "Room not found");
    }

    const [roomData] = JSON.parse(roomJson as string); // JSON.GET with `$` returns an array

    // Check if members array exists
    const currentMembers: RoomMember[] = roomData.members || [];
    const maxParticipants: number = roomData.maxParticipants || Infinity;

    // Check if member already exists (by ID)
    const alreadyExists = currentMembers.some(
      (m) => m.id && m.id === member.id
    );
    if (alreadyExists) {
      throw createHttpError(409, "Member already exists in the room");
    }

    // Check if maxParticipants is reached
    if (currentMembers.length >= maxParticipants) {
      throw createHttpError(403, "Maximum number of participants reached");
    }

    // Append new member
    const result = await redis.call(
      "JSON.ARRAPPEND",
      roomKey,
      "$.members",
      JSON.stringify(member)
    );

    // remove the room expiration
    await redis.persist(roomKey);

    return result;
  } catch (error) {
    console.error("Error in lib/room/addMember:", error);
    throw error;
  }
};
