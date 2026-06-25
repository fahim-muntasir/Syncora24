import { Request, Response, NextFunction } from "express";
import { RoomInputType, roomSchema } from "../../../../schemas/roomSchema";
import { createRoom } from "../../../../lib/room";
import { successResponse } from "../../../../utils/responseHelper";
import { v4 as uuidv4 } from "uuid";
import { getIo } from "../../../../socket/socket";

export const createChatController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params as { roomId: string };
    const { msg } = req.body;
    // const data: RoomInputType = roomSchema.parse(req.body);

    // const roomId = uuidv4();

    // const newRoom = await createRoom({
    //   roomId,
    //   hostId: req.user?.id,
    //   title: data.title,
    //   description: data.description,
    //   language: data.language,
    //   level: data.level,
    //   status: 'active',
    //   maxParticipants: data.maxParticipants,
    // });

    // // Emit socket event to all connected clients
    // getIo().to(roomId).emit("send-msg", { msg });

    // create all links for response
    // const links = {
    //   self: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    // };

    // send final response
    successResponse(res, {}, "Room created successfully!", 201, {});
  } catch (error) {
    next(error);
  }
};
