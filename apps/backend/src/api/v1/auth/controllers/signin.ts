import { Response, Request, NextFunction } from "express";
import createHttpError from "http-errors";
import { signInSchema } from "../../../../schemas/authSchema";
import { successResponse } from "../../../../utils/responseHelper";
import { comparePassword } from "../../../../utils/authUtils";
import { existAuthenticateUser } from "../../../../lib/auth";
import { tokenGenerator, refreshTokenGenerator } from "../../../../lib/auth";

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

    const refreshTokenPayload = {
      id: authenticateUser.id,
    };

    // generate a token
    const token = await tokenGenerator(payload);
    const refreshToken = await refreshTokenGenerator(refreshTokenPayload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
