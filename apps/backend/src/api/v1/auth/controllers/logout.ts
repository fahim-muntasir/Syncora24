import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../../utils/responseHelper";
import { revokeRefreshSession } from "../../../../lib/auth";
import { clearRefreshCookie } from "../refreshCookie";

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await revokeRefreshSession(req.cookies.refreshToken);
    clearRefreshCookie(res);

    successResponse(
      res,
      null,
      "Logged out successfully!",
      200,
    );
  } catch (error) {
    next(error);
  }
};