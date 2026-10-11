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
    const result = await redis.eval(
      `
      local roomJson = redis.call("JSON.GET", KEYS[1], "$")
      if not roomJson or roomJson == "null" then
        return -2
      end

      local room = cjson.decode(roomJson)[1]
      local members = room.members or {}
      for index, member in ipairs(members) do
        if member.id == ARGV[1] then
          redis.call("JSON.DEL", KEYS[1], "$.members[" .. (index - 1) .. "]")
          if #members == 1 then
            redis.call("EXPIRE", KEYS[1], 3600)
          end
          return index - 1
        end
      end
      return -1
      `,
      1,
      roomKey,
      memberId,
    );

    if (result === -2) {
      throw createHttpError(404, "Room not found");
    }

    return result === -1 ? undefined : result;
  } catch (error) {
    console.error("Error in lib/room/removeMember:", error);
    throw error;
  }
};
