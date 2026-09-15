import redis from "../../redis";
import createHttpError from "http-errors";

type SetModeratorRoleParams = {
  roomId: string;
  actorId: string;
  targetId: string;
  isModerator: boolean;
};

export const setModeratorRole = async ({
  roomId,
  actorId,
  targetId,
  isModerator,
}: SetModeratorRoleParams) => {
  const result = (await redis.eval(
    `
    local roomJson = redis.call("JSON.GET", KEYS[1], "$")
    if not roomJson or roomJson == "null" then
      return {0, "ROOM_NOT_FOUND"}
    end

    local room = cjson.decode(roomJson)[1]
    if room.hostId ~= ARGV[1] then
      return {0, "NOT_ALLOWED"}
    end
    if ARGV[1] == ARGV[2] then
      return {0, "CANNOT_CHANGE_HOST"}
    end

    local isCurrentlyModerator = redis.call("SISMEMBER", KEYS[2], ARGV[2]) == 1

    if ARGV[3] == "true" then
      local members = room.members or {}
      local isMember = false
      for _, member in ipairs(members) do
        if member.id == ARGV[2] then
          isMember = true
          break
        end
      end
      if not isMember then
        return {0, "MEMBER_NOT_FOUND"}
      end

      if isCurrentlyModerator then
        return {1, "ALREADY_MODERATOR"}
      end
      redis.call("SADD", KEYS[2], ARGV[2])
      return {1, "PROMOTED"}
    end

    if not isCurrentlyModerator then
      return {1, "ALREADY_MEMBER"}
    end
    redis.call("SREM", KEYS[2], ARGV[2])
    return {1, "DEMOTED"}
    `,
    2,
    `room:${roomId}`,
    `room:${roomId}:moderators`,
    actorId,
    targetId,
    isModerator ? "true" : "false",
  )) as [number, string];

  const [success, code] = result;
  if (success) {
    return {
      isModerator: code === "PROMOTED" || code === "ALREADY_MODERATOR",
      changed: code === "PROMOTED" || code === "DEMOTED",
    };
  }

  switch (code) {
    case "ROOM_NOT_FOUND":
      throw createHttpError(404, "Room not found.");
    case "NOT_ALLOWED":
      throw createHttpError(403, "Only the room admin can manage moderators.");
    case "CANNOT_CHANGE_HOST":
      throw createHttpError(400, "The room admin cannot be a moderator.");
    case "MEMBER_NOT_FOUND":
      throw createHttpError(404, "That user is not a current room member.");
    default:
      throw createHttpError(500, "Unable to update moderator role.");
  }
};
