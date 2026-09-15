import redis from "../../redis";

type CreateRoomParams = {
  roomId: string;
  hostId: string | undefined;
  createdAt?: string;
  title: string;
  description: string;
  language: string;
  level: string;
  status: string;
  maxParticipants: number;
};

export const createRoom = async ({
  roomId,
  hostId,
  createdAt = new Date().toISOString(),
  title,
  description,
  language,
  level,
  status,
  maxParticipants,
}: CreateRoomParams) => {
  try {
    const roomKey = `room:${roomId}`;

    const roomData = {
      id: roomId,
      hostId,
      level,
      createdAt,
      title,
      description,
      language,
      status,
      maxParticipants,
      members: [],
    };

    // Save as JSON using RedisJSON (JSON.SET key path value)
    await redis.call("JSON.SET", roomKey, "$", JSON.stringify(roomData));

    // Add room ID to a set for tracking all room IDs
    await redis.zadd("rooms", Date.now() + 1 * 60 * 60 * 1000, roomId);

    // Optional: Set expiration (e.g., 1 hour)
    await redis.expire(roomKey, 1 * 60 * 60);

    return roomData;
  } catch (error) {
    console.error("Error in lib/room/create (JSON version):", error);
    throw error;
  }
};
