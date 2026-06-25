import redis from "../../redis";

export const findSingleItem = async (roomId: string) => {
  try {
    if (!roomId) {
      throw new Error("Room ID is required.");
    }

    const data = await redis.call("JSON.GET", `room:${roomId}`, "$");

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data as string);
    return parsed[0];
  } catch (error) {
    console.error("Error in lib/room/findSingleRoom (JSON):", error);
    throw error;
  }
};
