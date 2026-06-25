// import redis from "../../redis";

// export const findAllItems = async () => {
//   try {
//     const roomIds = await redis.smembers("rooms");

//     const rooms = await Promise.all(
//       roomIds.map(async (id) => {
//         const data = await redis.call("JSON.GET", `room:${id}`, "$");
//         const parsed = JSON.parse(data as string);
//         return parsed[0]; // Because JSON.GET with "$" returns an array
//       })
//     );

//     return { data: rooms };
//   } catch (error) {
//     console.error("Error in lib/room/findAllItems (JSON):", error);
//     throw error;
//   }
// };

import redis from "../../redis";

export const findAllItems = async () => {
  try {
    // Get all room IDs (latest to oldest)
    const roomIds = await redis.zrevrange("rooms", 0, -1);

    const validRooms = [];

    for (const id of roomIds) {
      const key = `room:${id}`;
      const data = await redis.call("JSON.GET", key, "$");

      if (data) {
        const parsed = JSON.parse(data as string);
        validRooms.push(parsed[0]); // JSON.GET with "$" returns array
      } else {
        // Room key doesn't exist, so clean up the ID from the sorted set
        await redis.zrem("rooms", id);
      }
    }

    return { data: validRooms };
  } catch (error) {
    console.error("Error in lib/room/findAllItems (JSON):", error);
    throw error;
  }
};
