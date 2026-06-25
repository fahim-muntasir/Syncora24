import { Request, Response, NextFunction } from "express";
import createHttpError, { HttpError } from "http-errors";
import { ZodError } from "zod";
import { errorResponse } from "../utils/responseHelper";
import mongoose from "mongoose";

export const notFountError = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = createHttpError(404, "Resource not found!");

  next(error);
};

// Global Error Handler
export const globalErrorHandler = (
  error: HttpError | ZodError | Error | mongoose.Error.ValidationError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    return errorResponse(res, "Validation error", 400, formattedErrors);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      code: err.code,
    }));

    return errorResponse(res, "Validation error", 400, errors);
  }

  // Handle Mongoose duplicate key errors
  if ("code" in error && error.code === 11000) {
    const duplicateKey = Object.keys(error.keyValue)[0];
    return errorResponse(res, `${duplicateKey} already exists.`, 409);
  }

  // Handle HTTP errors
  if ((error as HttpError).status) {
    return errorResponse(res, error.message, (error as HttpError).status);
  }

  // Handle generic errors (500 - Internal Server Error)
  return errorResponse(res, "Something went wrong!", 500);
};
