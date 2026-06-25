import { Request, Response, NextFunction } from "express";
import {RoomInputType, roomSchema} from "../../../../schemas/roomSchema";
import { createRoom } from "../../../../lib/room";
import { successResponse } from "../../../../utils/responseHelper";
import { v4 as uuidv4 } from 'uuid';
import { getIo } from "../../../../socket/socket";

export const createRoomController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: RoomInputType = roomSchema.parse(req.body);

    const roomId = uuidv4();

    // room creation
    const newRoom = await createRoom({
      roomId,
      hostId: req.user?.id,
      title: data.title,
      description: data.description,
      language: data.language,
      level: data.level,
      status: 'active',
      maxParticipants: data.maxParticipants,
    });

    // Emit socket event to all connected clients
    getIo().emit('roomCreated', newRoom);

    // create all links for response
    const links = {
      self: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      room: `${req.protocol}://${req.get("host")}/v1/room/${newRoom.id}`,
    };

    // send final response
    successResponse(
      res,
      newRoom,
      "Room created successfully!",
      201,
      links
    );
  } catch (error) {
    next(error);
  }
};
