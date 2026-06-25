import { Response, Request, NextFunction } from "express";
import { signUpSchema } from "../../../../schemas/authSchema";
import { successResponse } from "../../../../utils/responseHelper";
import { signUp } from "../../../../lib/auth";
import { hashPassword } from "../../../../utils/authUtils";

export const signUpController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate the req body with zod
    signUpSchema.parse(req.body);

    const password = await hashPassword(req.body.password);

    // create the user
    const createdUser = await signUp({ ...req.body, password });

    const responseData = {
      id: createdUser.id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      role: createdUser.role,
      updatedAt: createdUser.updatedAt,
      createdAt: createdUser.createdAt,
    };

    const links = {
      self: `/users/${createdUser.id}`
    };

    // send the final response
    successResponse(res, responseData, "User created successfully!", 201, links);
  } catch (error) {
    next(error);
  }
};
