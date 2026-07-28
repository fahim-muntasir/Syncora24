import jwt, { SignOptions } from "jsonwebtoken";
import createHttpError from "http-errors";

type RefreshTokenPayload = {
  id: string;
  exp: number;
};

const expiresIn = (process.env.ACCESS_TOKEN_EXPIRESIN ??
  "1h") as SignOptions["expiresIn"];

// Generate JWT Token
export const tokenGenerator = async (payload: object): Promise<string> => {
  try {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw createHttpError(500, "ACCESS_TOKEN_SECRET is not defined.");
    }

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn,
    });

    return token;
  } catch (error) {
    // Handle invalid payload
    if (error instanceof jwt.JsonWebTokenError) {
      throw createHttpError(
        400,
        `Invalid payload: ${(error as Error).message}`,
      );
    }

    throw createHttpError(
      500,
      `Token generation failed: ${(error as Error).message}`,
    );
  }
};

export const refreshTokenGenerator = async (
  payload: object,
): Promise<string> => {
  try {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw createHttpError(500, "REFRESH_TOKEN_SECRET is not defined.");
    }

    const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "7d",
    });

    return token;
  } catch (error) {
    // Handle invalid payload
    if (error instanceof jwt.JsonWebTokenError) {
      throw createHttpError(
        400,
        `Invalid payload: ${(error as Error).message}`,
      );
    }

    throw createHttpError(
      500,
      `Token generation failed: ${(error as Error).message}`,
    );
  }
};

export const refreshTokenValidator = async (
  token: string,
): Promise<RefreshTokenPayload> => {
  try {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw createHttpError(500, "REFRESH_TOKEN_SECRET is not defined.");
    }

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (typeof decoded === "string") {
      throw createHttpError(401, "Invalid token payload.");
    }

    return decoded as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createHttpError(401, "Token has expired.");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw createHttpError(400, "Invalid token.");
    }

    throw createHttpError(
      500,
      `Token validation failed: ${(error as Error).message}`,
    );
  }
};

// Validate JWT Token
export const tokenValidator = async (
  token: string,
): Promise<object | string> => {
  try {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw createHttpError(500, "ACCESS_TOKEN_SECRET is not defined.");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    return decoded;
  } catch (error) {
    // Handle token expiration
    if (error instanceof jwt.TokenExpiredError) {
      throw createHttpError(401, "Token has expired.");
    }
    // Handle invalid or malformed token
    if (error instanceof jwt.JsonWebTokenError) {
      throw createHttpError(400, "Invalid token.");
    }

    throw createHttpError(
      500,
      `Token validation failed: ${(error as Error).message}`,
    );
  }
};
