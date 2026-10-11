import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../../../utils/responseHelper";
import { addMember } from "../../../../lib/room";
import { joinRoomSchema } from "../../../../schemas/roomSchema";

export const addMembersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const roomId = req.params.roomId as string; 

  try {
    if (!req.user?.id || !req.user.fullName) {
      throw new Error("Authenticated user information is required");
    }

    const { side } = joinRoomSchema.parse(req.body ?? {});
    const member = {
      id: req.user?.id,
      name: req.user?.fullName,
      side,
    }
    const result = await addMember({ roomId, member });

    // send final response
    successResponse(res, result, "Member added successfully!", 200);
  } catch (error) {
    next(error);
  }
};
