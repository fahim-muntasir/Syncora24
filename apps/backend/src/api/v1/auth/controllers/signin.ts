import { Response, Request, NextFunction } from "express";
import createHttpError from "http-errors";
import { signInSchema } from "../../../../schemas/authSchema";
import { successResponse } from "../../../../utils/responseHelper";
import { comparePassword } from "../../../../utils/authUtils";
import { existAuthenticateUser } from "../../../../lib/auth";
import {
  issueRefreshSession,
  tokenGenerator,
} from "../../../../lib/auth";
import { setRefreshCookie } from "../refreshCookie";

export const signInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate the req body with zod
    const validatedData = signInSchema.parse(req.body);

    const authenticateUser = await existAuthenticateUser(validatedData.email);

    if (!authenticateUser) {
      throw createHttpError(401, "Authentication failed");
    }

    const isPasswordMatched = await comparePassword(validatedData.password, authenticateUser.password);

    if (!isPasswordMatched) {
      throw createHttpError(401, "Authentication failed");
    }

    const payload = {
      id: authenticateUser.id,
      fullName: authenticateUser.fullName,
      email: authenticateUser.email,
      role: authenticateUser.role,
      updatedAt: authenticateUser.updatedAt,
      createdAt: authenticateUser.createdAt,
    };

    // generate a token
    const token = await tokenGenerator(payload);
    const refreshToken = await issueRefreshSession(authenticateUser.id);
    setRefreshCookie(res, refreshToken);

    const links = {
      self: `/users/${authenticateUser.id}`
    };

    const responseData = {
      token,
      user: payload,
    }

    // send the final response
    successResponse(res, responseData, "Login successfully!", 200, links);
  } catch (error) {
    next(error);
  }
};
