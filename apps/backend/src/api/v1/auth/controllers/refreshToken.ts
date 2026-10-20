import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { successResponse } from "../../../../utils/responseHelper";
import {
  refreshTokenValidator,
  rotateRefreshSession,
  revokeRefreshSession,
  tokenGenerator,
} from "../../../../lib/auth";
import { existAuthenticateUserById } from "../../../../lib/auth";
import { clearRefreshCookie, setRefreshCookie } from "../refreshCookie";

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
    if (!decoded || !decoded.id) {
      throw createHttpError(401, "Invalid refresh token");
    }

    // Get the latest user data from database
    const authenticateUser = await existAuthenticateUserById(decoded.id);

    if (!authenticateUser) {
      await revokeRefreshSession(refreshToken);
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

    // Create the access token before rotating so configuration errors don't consume the session.
    const token = await tokenGenerator(payload);
    const rotation = await rotateRefreshSession(refreshToken);
    setRefreshCookie(res, rotation.refreshToken);

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
    if (
      error !== null &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 401
    ) {
      clearRefreshCookie(res);
    }
    next(error);
  }
};
