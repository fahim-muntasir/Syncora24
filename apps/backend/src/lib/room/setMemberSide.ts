import createHttpError from "http-errors";
import redis from "../../redis";
import type { DebateSide } from "../../schemas/roomSchema";

type SetMemberSideParams = {
  roomId: string;
  memberId: string;
  side: DebateSide;
};

export const setMemberSide = async ({
  roomId,
  memberId,
  side,
}: SetMemberSideParams): Promise<{ previousSide?: DebateSide }> => {
  const result = await redis.eval(
    `
    local roomJson = redis.call("JSON.GET", KEYS[1], "$")
    if not roomJson or roomJson == "null" then
      return {"ROOM_NOT_FOUND"}
    end

    local roomArray = cjson.decode(roomJson)
    local room = roomArray[1]
    if room.type ~= "debate" then
      return {"NOT_DEBATE_ROOM"}
    end

    local members = room.members or {}
    for index, member in ipairs(members) do
      if member.id == ARGV[1] then
        local previousSide = member.side or ""
        member.side = ARGV[2]
        redis.call("JSON.SET", KEYS[1], "$.members[" .. (index - 1) .. "]", cjson.encode(member))
        return {"OK", previousSide}
      end
    end

    return {"NOT_MEMBER"}
    `,
    1,
    `room:${roomId}`,
    memberId,
    side,
  ) as [string, string?];

  const [status, previousSide] = result;
  switch (status) {
    case "OK":
      return {
        previousSide:
          previousSide === "for" || previousSide === "against"
            ? previousSide
            : undefined,
      };
    case "ROOM_NOT_FOUND":
      throw createHttpError(404, "This room is no longer available.");
    case "NOT_DEBATE_ROOM":
      throw createHttpError(400, "Participant positions are only available in debate rooms.");
    case "NOT_MEMBER":
      throw createHttpError(403, "Join the room before changing your position.");
    default:
      throw createHttpError(500, "Unable to update your debate position.");
  }
};
