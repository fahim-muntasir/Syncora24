import { OAuth2Client, TokenPayload } from "google-auth-library";
import createHttpError from "http-errors";

export type GoogleIdentity = {
  sub: string;
  email: string;
  fullName: string;
};

export const googleIdentityFromPayload = (
  payload: TokenPayload | undefined,
  audience: string,
  now = Date.now(),
): GoogleIdentity => {
  const validIssuer =
    payload?.iss === "accounts.google.com" ||
    payload?.iss === "https://accounts.google.com";

  if (
    !payload ||
    !validIssuer ||
    payload.aud !== audience ||
    typeof payload.exp !== "number" ||
    payload.exp * 1000 <= now ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.sub.length > 255 ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true
  ) {
    throw createHttpError(401, "Google credential is invalid or expired.");
  }

  const email = payload.email.trim().toLowerCase();
  const fullName = payload.name?.trim() || email.split("@")[0];
  if (
    !/^\S+@\S+\.\S+$/.test(email) ||
    email.length > 320 ||
    !fullName ||
    fullName.length > 120 ||
    /[\u0000-\u001f\u007f]/.test(fullName)
  ) {
    throw createHttpError(401, "Google credential is missing required profile data.");
  }

  return { sub: payload.sub, email, fullName };
};

export const verifyGoogleIdToken = async (
  idToken: string,
): Promise<GoogleIdentity> => {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    throw createHttpError(500, "GOOGLE_CLIENT_ID is not configured.");
  }

  try {
    const ticket = await new OAuth2Client(audience).verifyIdToken({
      idToken,
      audience,
    });
    return googleIdentityFromPayload(ticket.getPayload(), audience);
  } catch (error) {
    if (createHttpError.isHttpError(error)) {
      throw error;
    }
    throw createHttpError(401, "Google credential could not be verified.");
  }
};
