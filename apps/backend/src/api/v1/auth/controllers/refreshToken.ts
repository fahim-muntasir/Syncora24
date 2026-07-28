import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { successResponse } from "../../../../utils/responseHelper";
import {
  refreshTokenValidator,
  tokenGenerator,
  refreshTokenGenerator,
} from "../../../../lib/auth";
import { existAuthenticateUserById } from "../../../../lib/auth";

export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw createHttpError(401, "Refresh token not found");
    }

    // Verify refresh token
    const decoded = await refreshTokenValidator(refreshToken);

    const currentTime = Math.floor(Date.now() / 1000);

    const remainingTime = decoded.exp - currentTime;

    const shouldRotateRefreshToken = remainingTime <= 24 * 60 * 60;

    if (!decoded || !decoded.id) {
      throw createHttpError(401, "Invalid refresh token");
    }

    // Get the latest user data from database
    const authenticateUser = await existAuthenticateUserById(decoded.id);

    if (!authenticateUser) {
      throw createHttpError(401, "User no longer exists");
    }

    // Create a fresh payload
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

    // Generate a new access token
    const token = await tokenGenerator(payload);

    if (shouldRotateRefreshToken) {
      const newRefreshToken = await refreshTokenGenerator(refreshTokenPayload);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const links = {
      self: `/users/${authenticateUser.id}`,
    };

    const responseData = {
      token,
      user: payload,
    };

    successResponse(
      res,
      responseData,
      "Access token refreshed successfully!",
      200,
      links,
    );
  } catch (error) {
    next(error);
  }
};
