import { createHmac, randomUUID } from "crypto";
import createHttpError from "http-errors";
import { RefreshSession as RefreshSessionModel } from "../../models";
import {
  refreshTokenGenerator,
  refreshTokenValidator,
} from "./token";

export interface RefreshSession {
  sessionId: string;
  userId: string;
  currentJti: string;
  currentTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface RefreshSessionRepository {
  create(session: RefreshSession): Promise<void>;
  findById(sessionId: string): Promise<RefreshSession | null>;
  rotateIfCurrent(input: {
    sessionId: string;
    userId: string;
    currentJti: string;
    currentTokenHash: string;
    nextJti: string;
    nextTokenHash: string;
    expiresAt: Date;
    now: Date;
  }): Promise<boolean>;
  revokeIfTokenMismatch(input: {
    sessionId: string;
    currentJti: string;
    currentTokenHash: string;
    now: Date;
  }): Promise<void>;
  revoke(sessionId: string, now: Date): Promise<void>;
}

const repository: RefreshSessionRepository = {
  async create(session) {
    await RefreshSessionModel.create({
      _id: session.sessionId,
      userId: session.userId,
      currentJti: session.currentJti,
      currentTokenHash: session.currentTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: null,
    });
  },
  async findById(sessionId) {
    const session = await RefreshSessionModel.findById(sessionId)
      .select("+currentTokenHash")
      .lean()
      .exec();

    if (!session) {
      return null;
    }

    return {
      sessionId: session._id,
      userId: session.userId,
      currentJti: session.currentJti,
      currentTokenHash: session.currentTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    };
  },
  async rotateIfCurrent(input) {
    const session = await RefreshSessionModel.findOneAndUpdate(
      {
        _id: input.sessionId,
        userId: input.userId,
        currentJti: input.currentJti,
        currentTokenHash: input.currentTokenHash,
        revokedAt: null,
        expiresAt: { $gt: input.now },
      },
      {
        $set: {
          currentJti: input.nextJti,
          currentTokenHash: input.nextTokenHash,
          expiresAt: input.expiresAt,
        },
      },
      { new: true },
    )
      .select("_id")
      .lean()
      .exec();

    return session !== null;
  },
  async revokeIfTokenMismatch(input) {
    await RefreshSessionModel.updateOne(
      {
        _id: input.sessionId,
        revokedAt: null,
        expiresAt: { $gt: input.now },
        $or: [
          { currentJti: { $ne: input.currentJti } },
          { currentTokenHash: { $ne: input.currentTokenHash } },
        ],
      },
      { $set: { revokedAt: input.now } },
    ).exec();
  },
  async revoke(sessionId, now) {
    await RefreshSessionModel.updateOne(
      { _id: sessionId, revokedAt: null },
      { $set: { revokedAt: now } },
    ).exec();
  },
};

const hashRefreshToken = (token: string): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw createHttpError(500, "REFRESH_TOKEN_SECRET is not defined.");
  }

  return createHmac("sha256", secret).update(token).digest("hex");
};

const requireSessionClaims = (
  decoded: Awaited<ReturnType<typeof refreshTokenValidator>>,
) => {
  if (!decoded.sid || !decoded.jti) {
    throw createHttpError(401, "Refresh session is no longer valid.");
  }

  return { sessionId: decoded.sid, tokenId: decoded.jti };
};

export const issueRefreshSession = async (
  userId: string,
  sessionRepository: RefreshSessionRepository = repository,
): Promise<string> => {
  const sessionId = randomUUID();
  const tokenId = randomUUID();
  const token = await refreshTokenGenerator({
    id: userId,
    sid: sessionId,
    jti: tokenId,
  });
  const decoded = await refreshTokenValidator(token);

  await sessionRepository.create({
    sessionId,
    userId,
    currentJti: tokenId,
    currentTokenHash: hashRefreshToken(token),
    expiresAt: new Date(decoded.exp * 1000),
    revokedAt: null,
  });

  return token;
};

export const rotateRefreshSession = async (
  token: string,
  sessionRepository: RefreshSessionRepository = repository,
): Promise<{ refreshToken: string; userId: string; expiresAt: Date }> => {
  const decoded = await refreshTokenValidator(token);
  const { sessionId, tokenId } = requireSessionClaims(decoded);
  const currentTokenHash = hashRefreshToken(token);
  const now = new Date();
  const currentSession = await sessionRepository.findById(sessionId);

  if (
    !currentSession ||
    currentSession.revokedAt ||
    currentSession.expiresAt <= now ||
    currentSession.userId !== decoded.id
  ) {
    throw createHttpError(401, "Refresh session is no longer valid.");
  }

  if (
    currentSession.currentJti !== tokenId ||
    currentSession.currentTokenHash !== currentTokenHash
  ) {
    await sessionRepository.revokeIfTokenMismatch({
      sessionId,
      currentJti: tokenId,
      currentTokenHash,
      now,
    });
    throw createHttpError(401, "Refresh token reuse detected.");
  }

  const nextTokenId = randomUUID();
  const nextToken = await refreshTokenGenerator({
    id: decoded.id,
    sid: sessionId,
    jti: nextTokenId,
  });
  const nextDecoded = await refreshTokenValidator(nextToken);
  const nextTokenHash = hashRefreshToken(nextToken);
  const expiresAt = new Date(nextDecoded.exp * 1000);
  const rotated = await sessionRepository.rotateIfCurrent({
    sessionId,
    userId: decoded.id,
    currentJti: tokenId,
    currentTokenHash,
    nextJti: nextTokenId,
    nextTokenHash,
    expiresAt,
    now,
  });

  if (!rotated) {
    const latestSession = await sessionRepository.findById(sessionId);
    if (
      latestSession &&
      !latestSession.revokedAt &&
      latestSession.expiresAt > now &&
      (latestSession.currentJti !== tokenId ||
        latestSession.currentTokenHash !== currentTokenHash)
    ) {
      await sessionRepository.revokeIfTokenMismatch({
        sessionId,
        currentJti: tokenId,
        currentTokenHash,
        now,
      });
    }

    throw createHttpError(401, "Refresh session is no longer valid.");
  }

  return { refreshToken: nextToken, userId: decoded.id, expiresAt };
};

export const revokeRefreshSession = async (
  token: string | undefined,
  sessionRepository: RefreshSessionRepository = repository,
): Promise<void> => {
  if (!token) {
    return;
  }

  let decoded: Awaited<ReturnType<typeof refreshTokenValidator>>;
  try {
    decoded = await refreshTokenValidator(token, {
      ignoreExpiration: true,
      allowLegacy: true,
    });
  } catch (error) {
    if (createHttpError.isHttpError(error) && error.status === 401) {
      return;
    }

    throw error;
  }

  if (decoded.sid) {
    await sessionRepository.revoke(decoded.sid, new Date());
  }
};
