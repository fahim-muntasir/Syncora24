import { Response, Request, NextFunction } from "express";
import { findSingleItem } from "../../../../lib/room";
import { successResponse } from "../../../../utils/responseHelper";

export const getSingleRoomController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roomId } = req.params;

  try {
    const data = await findSingleItem(roomId);

    // send final response
    successResponse(res, data, "Rooms fetched successfully", 201, {});
  } catch (error) {
    next(error);
  }
};
