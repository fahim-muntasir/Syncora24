import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../../../utils/responseHelper";
import { addMember } from "../../../../lib/room";

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

    const member = {
      id: req.user?.id,
      name: req.user?.fullName,
    }
    const result = await addMember({ roomId, member });

    // send final response
    successResponse(res, result, "Member added successfully!", 200);
  } catch (error) {
    next(error);
  }
};
