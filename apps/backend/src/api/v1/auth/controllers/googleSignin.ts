import { Response, Request, NextFunction } from "express";
import createHttpError from "http-errors";
import { googleSignInSchema } from "../../../../schemas/authSchema";
import { successResponse } from "../../../../utils/responseHelper";
import {
  issueRefreshSession,
  tokenGenerator,
} from "../../../../lib/auth";
import { GoogleAuthUser, findOrCreateGoogleUser } from "../../../../lib/auth/googleUser";
import { verifyGoogleIdToken } from "../../../../lib/auth/googleIdentity";
import { setRefreshCookie } from "../refreshCookie";

const userPayload = (user: GoogleAuthUser) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  updatedAt: user.updatedAt,
  createdAt: user.createdAt,
});

export const googleSignInController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { idToken } = googleSignInSchema.parse(req.body);
    const identity = await verifyGoogleIdToken(idToken);
    const user = await findOrCreateGoogleUser(identity);

    if (user.role !== "user" && user.role !== "admin") {
      throw createHttpError(403, "This account cannot sign in.");
    }

    const payload = userPayload(user);
    const token = await tokenGenerator(payload);
    const refreshToken = await issueRefreshSession(user.id);
    setRefreshCookie(res, refreshToken);

    successResponse(
      res,
      { token, user: payload },
      "Login successfully!",
      200,
      { self: `/users/${user.id}` },
    );
  } catch (error) {
    next(error);
  }
};
