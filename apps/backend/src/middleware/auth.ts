import { Request, Response, NextFunction } from "express";
import { tokenValidator } from "../lib/auth";
import createHttpError from "http-errors";
import { isUserType } from "../utils/typeGuards";

export const auth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      throw createHttpError(
        401,
        "Authorization header is missing. Please include a valid token."
      );
    }

    const token = req.headers.authorization.split(" ")[1];

    const decoded = await tokenValidator(token);

    // Use the type guard to validate `decoded`
    if (!isUserType(decoded)) {
      throw createHttpError(401, "Invalid token payload.");
    }

    req.user = {
      id: decoded.id,
      fullName: decoded.fullName,
      email: decoded.email,
      role: decoded.role,
      updatedAt: decoded.updatedAt,
      createdAt: decoded.createdAt,
    };

    next();
  } catch (error) {
    next(error);
  }
};
