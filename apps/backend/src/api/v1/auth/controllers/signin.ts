import { Response, Request, NextFunction } from "express";
import createHttpError from "http-errors";
import { signInSchema } from "../../../../schemas/authSchema";
import { successResponse } from "../../../../utils/responseHelper";
import { comparePassword } from "../../../../utils/authUtils";
import { existAuthenticateUser } from "../../../../lib/auth";
import { tokenGenerator } from "../../../../lib/auth";

export const signInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate the req body with zod
    signInSchema.parse(req.body);

    const authenticateUser = await existAuthenticateUser(req.body.email)

    if (!authenticateUser) {
      throw createHttpError(401, "Authentication failed");
    }

    const isPasswordMatched = await comparePassword(req.body.password, authenticateUser.password);

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
