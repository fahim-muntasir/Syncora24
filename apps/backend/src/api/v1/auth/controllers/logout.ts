import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../../utils/responseHelper";

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

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