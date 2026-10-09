import { Request, Response, NextFunction } from "express";
import { RoomInputType, roomSchema } from "../../../../schemas/roomSchema";
import { createRoom } from "../../../../lib/room";
import { successResponse } from "../../../../utils/responseHelper";
import { v4 as uuidv4 } from "uuid";

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
