import { Response } from "express";

const refreshCookieScope = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    ...refreshCookieScope,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refreshToken", refreshCookieScope);
};
