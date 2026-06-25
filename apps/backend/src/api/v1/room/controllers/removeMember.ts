import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../../../utils/responseHelper";
import { removeMember } from "../../../../lib/room";
import { getIo } from "../../../../socket/socket";
import createHttpError from "http-errors";

export const removeMembersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roomId } = req.params;

  try {
    if (!roomId || !req.user?.id) {
      throw createHttpError(400, "Room ID and User ID are required");
    }

    const result = await removeMember({ roomId, memberId: req.user.id });

    // getIo().emit("removedMember", {
    //   roomId,
    //   memberId: req.user.id,
    // });

    // send final response
    successResponse(res, result, "Member removed successfully!", 200);
  } catch (error) {
    next(error);
  }
};
