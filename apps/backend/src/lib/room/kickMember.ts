import redis from "../../redis";
import createHttpError from "http-errors";

type KickMemberParams = {
  roomId: string;
  actorId: string;
  targetId: string;
};

export const kickMember = async ({
  roomId,
  actorId,
  targetId,
}: KickMemberParams) => {
  const result = (await redis.eval(
    `
    local roomJson = redis.call("JSON.GET", KEYS[1], "$")
    if not roomJson or roomJson == "null" then
      return {0, "ROOM_NOT_FOUND"}
    end

    local room = cjson.decode(roomJson)[1]
    local members = room.members or {}
    local actorIsHost = room.hostId == ARGV[1]
    local actorIsModerator = false
    local targetIsModerator = false

    actorIsModerator = redis.call("SISMEMBER", KEYS[2], ARGV[1]) == 1
    targetIsModerator = redis.call("SISMEMBER", KEYS[2], ARGV[2]) == 1

    if not actorIsHost and not actorIsModerator then
      return {0, "NOT_ALLOWED"}
    end
    if ARGV[1] == ARGV[2] then
      return {0, "CANNOT_KICK_SELF"}
    end
    if ARGV[2] == room.hostId then
      return {0, "CANNOT_KICK_HOST"}
    end
    if actorIsModerator and targetIsModerator then
      return {0, "CANNOT_KICK_MODERATOR"}
    end

    local memberIndex = -1
    for index, member in ipairs(members) do
      if member.id == ARGV[2] then
        memberIndex = index - 1
        break
      end
    end
    if memberIndex < 0 then
      return {0, "MEMBER_NOT_FOUND"}
    end

    redis.call("JSON.DEL", KEYS[1], "$.members[" .. memberIndex .. "]")
    redis.call("SADD", KEYS[3], ARGV[2])
    return {1, "MEMBER_KICKED"}
    `,
    3,
    `room:${roomId}`,
    `room:${roomId}:moderators`,
    `room:${roomId}:kicked-members`,
    actorId,
    targetId,
  )) as [number, string];

  const [success, code] = result;
  if (success) return { kicked: true };

  switch (code) {
    case "ROOM_NOT_FOUND":
      throw createHttpError(404, "Room not found.");
    case "NOT_ALLOWED":
      throw createHttpError(403, "You do not have permission to kick members.");
    case "CANNOT_KICK_SELF":
      throw createHttpError(400, "You cannot kick yourself.");
    case "CANNOT_KICK_HOST":
      throw createHttpError(403, "The room admin cannot be kicked.");
    case "CANNOT_KICK_MODERATOR":
      throw createHttpError(403, "Only the room admin can kick a moderator.");
    case "MEMBER_NOT_FOUND":
      throw createHttpError(404, "That member is no longer in the room.");
    default:
      throw createHttpError(500, "Unable to kick this member.");
  }
};
