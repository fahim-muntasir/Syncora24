import { Schema, model } from "mongoose";

export interface RefreshSessionRecord {
  _id: string;
  userId: string;
  currentJti: string;
  currentTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

const refreshSessionSchema = new Schema<RefreshSessionRecord>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    currentJti: { type: String, required: true },
    currentTokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession = model<RefreshSessionRecord>(
  "RefreshSession",
  refreshSessionSchema,
);
