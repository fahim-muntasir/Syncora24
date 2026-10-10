import redis from "../../redis";
import createHttpError from "http-errors";
import type { DebateSide } from "../../schemas/roomSchema";

type RoomMember = {
  id: string;
  name: string;
  avatar?: string;
  side?: DebateSide;
};

type AddMemberParams = {
  roomId: string;
  member: RoomMember;
};

type AddMemberResult = {
  added: boolean;
  alreadyMember: boolean;
  sideAssigned: boolean;
};

export const addMember = async ({
  roomId,
  member,
}: AddMemberParams): Promise<AddMemberResult> => {
  const roomKey = `room:${roomId}`;

  try {
    const result = (await redis.eval(
      `
      local roomJson = redis.call("JSON.GET", KEYS[1], "$")

      if not roomJson or roomJson == "null" then
        return {0, "ROOM_NOT_FOUND"}
      end

      local roomArray = cjson.decode(roomJson)
      local room = roomArray[1]

      -- Check room status
      if room.isEnded == true then
        return {0, "ROOM_ENDED"}
      end

      local members = room.members or {}
      local userId = ARGV[1]
      local maxParticipants = room.maxParticipants
      local memberJson = cjson.decode(ARGV[2])
      local roomType = room.type or "open"

      if memberJson.side ~= nil and memberJson.side ~= "for" and memberJson.side ~= "against" then
        return {0, "INVALID_DEBATE_SIDE"}
      end

      if roomType == "debate" and memberJson.side == nil then
        return {0, "INVALID_DEBATE_SIDE"}
      end
      if roomType ~= "debate" then
        memberJson.side = nil
      end

      -- Validate capacity configuration
      if not maxParticipants then
        return {0, "INVALID_ROOM_CAPACITY"}
      end

      if redis.call("SISMEMBER", KEYS[2], userId) == 1 then
        return {0, "MEMBER_KICKED"}
      end

      -- Check whether the user is already a member
      for index, existingMember in ipairs(members) do
        if existingMember.id == userId then
          if roomType == "debate" and existingMember.side == nil then
            existingMember.side = memberJson.side
            redis.call(
              "JSON.SET",
              KEYS[1],
              "$.members[" .. (index - 1) .. "]",
              cjson.encode(existingMember)
            )
            return {1, "MEMBER_SIDE_ASSIGNED"}
          end
          return {1, "ALREADY_MEMBER"}
        end
      end

      -- Check room capacity
      if #members >= maxParticipants then
        return {0, "ROOM_FULL"}
      end

      -- Add member atomically
      redis.call(
        "JSON.ARRAPPEND",
        KEYS[1],
        "$.members",
        cjson.encode(memberJson)
      )

      -- Keep your existing behavior
      redis.call("PERSIST", KEYS[1])

      return {1, "MEMBER_ADDED"}
      `,
      2,
      roomKey,
      `room:${roomId}:kicked-members`,
      member.id,
      JSON.stringify(member),
    )) as [number, string];

    const [success, code] = result;
    if (!success) {
      switch (code) {
        case "ROOM_NOT_FOUND":
          throw createHttpError(404, "This room is no longer available.");

        case "ROOM_ENDED":
          throw createHttpError(400, "This room has already ended.");

        case "ROOM_FULL":
          throw createHttpError(403, "This room is full.");

        case "INVALID_DEBATE_SIDE":
          throw createHttpError(400, "Choose For or Against before joining this debate room.");

        case "MEMBER_KICKED":
          throw createHttpError(
            403,
            "You have been removed from this room and cannot join again.",
          );

        case "INVALID_ROOM_CAPACITY":
          throw createHttpError(
            500,
            "Unable to join the room. Please try again later.",
          );

        default:
          throw createHttpError(
            500,
            "Something went wrong while joining the room. Please try again.",
          );
      }
    }

    return {
      added: code === "MEMBER_ADDED",
      alreadyMember: code === "ALREADY_MEMBER",
      sideAssigned: code === "MEMBER_SIDE_ASSIGNED",
    };
  } catch (error) {
    console.error("[Room] Failed to add member:", error);
    throw error;
  }
};
