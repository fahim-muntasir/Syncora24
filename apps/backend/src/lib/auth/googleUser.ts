import createHttpError from "http-errors";
import { Auth } from "../../models";
import { GoogleIdentity } from "./googleIdentity";

export type GoogleAuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  updatedAt: Date;
  createdAt: Date;
};

export type GoogleUserRepository = {
  findByGoogleId(sub: string): Promise<GoogleAuthUser | null>;
  findByEmail(email: string): Promise<GoogleAuthUser | null>;
  create(input: {
    googleId: string;
    email: string;
    fullName: string;
  }): Promise<GoogleAuthUser>;
};

type AuthDocument = {
  _id: { toString(): string };
  fullName?: string | null;
  email: string;
  role: string;
  updatedAt: Date;
  createdAt: Date;
};

const toGoogleAuthUser = (user: AuthDocument): GoogleAuthUser => ({
  id: user._id.toString(),
  fullName: user.fullName ?? "",
  email: user.email,
  role: user.role,
  updatedAt: user.updatedAt,
  createdAt: user.createdAt,
});

const repository: GoogleUserRepository = {
  async findByGoogleId(sub) {
    const user = await Auth.findOne({ googleId: sub })
      .select("+googleId")
      .exec();
    return user ? toGoogleAuthUser(user) : null;
  },
  async findByEmail(email) {
    const user = await Auth.findOne({ email }).exec();
    return user ? toGoogleAuthUser(user) : null;
  },
  async create(input) {
    const user = await Auth.create(input);
    return toGoogleAuthUser(user);
  },
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const findOrCreateGoogleUser = async (
  identity: GoogleIdentity,
  users: GoogleUserRepository = repository,
): Promise<GoogleAuthUser> => {
  const existingGoogleUser = await users.findByGoogleId(identity.sub);
  if (existingGoogleUser) {
    return existingGoogleUser;
  }

  const existingEmailUser = await users.findByEmail(identity.email);
  if (existingEmailUser) {
    throw createHttpError(
      409,
      "An account with this email already exists. Sign in with email and password; accounts are not linked automatically.",
    );
  }

  try {
    return await users.create({
      googleId: identity.sub,
      email: identity.email,
      fullName: identity.fullName,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const concurrentlyCreatedGoogleUser = await users.findByGoogleId(
      identity.sub,
    );
    if (concurrentlyCreatedGoogleUser) {
      return concurrentlyCreatedGoogleUser;
    }

    throw createHttpError(
      409,
      "An account with this email already exists. Sign in with email and password; accounts are not linked automatically.",
    );
  }
};
