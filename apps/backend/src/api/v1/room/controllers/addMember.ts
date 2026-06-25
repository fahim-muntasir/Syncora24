import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../../../utils/responseHelper";
import { addMember } from "../../../../lib/room";
import { getIo } from "../../../../socket/socket";

export const addMembersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roomId } = req.params;

  try {
    const member = {
      id: req.user?.id,
      name: req.user?.fullName,
    }
    const result = await addMember({ roomId, member });

    getIo().emit("joinedMember", {
      roomId,
      newMember: member,
    });

    // getIo().to(roomId).emit("user-joined", { roomId, user: member });

    // send final response
    successResponse(res, result, "Member added successfully!", 200);
  } catch (error) {
    next(error);
  }
};
