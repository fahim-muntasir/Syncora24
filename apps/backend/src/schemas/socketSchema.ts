import { z } from "zod";
import { debateSideSchema } from "./roomSchema";

export const socketRoomIdSchema = z.string().uuid();
export const socketUserIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

const roomIdPayload = {
  roomId: socketRoomIdSchema,
};

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_MEDIA_URL_LENGTH = 2048;

const mediaUrlSchema = z
  .string()
  .max(MAX_MEDIA_URL_LENGTH)
  .url()
  .refine((value) =>
    ["http:", "https:", "blob:"].includes(new URL(value).protocol),
  );

const chatMessageSchema = z
  .object({
    text: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH).optional(),
    emojiOnly: z.boolean().optional(),
    imageUrl: mediaUrlSchema.optional(),
    gifUrl: mediaUrlSchema.optional(),
    senderName: z.string().max(100).optional(),
    replyTo: z
      .object({
        id: z.union([z.string().min(1).max(100), z.number().finite()]),
        name: z.string().trim().min(1).max(100),
        text: z.string().max(MAX_CHAT_MESSAGE_LENGTH).optional(),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (message) =>
      Boolean(message.text || message.imageUrl || message.gifUrl),
    "A message must contain text or media.",
  );

export const sendMessageSocketSchema = z
  .object({
    ...roomIdPayload,
    message: chatMessageSchema,
  })
  .strict();

export const joinRoomSocketSchema = z
  .object({
    ...roomIdPayload,
    side: debateSideSchema.optional(),
    reconnectOnly: z.boolean().optional(),
  })
  .strict();

export const leaveRoomSocketSchema = z
  .object(roomIdPayload)
  .strict();

export const changeMemberSideSocketSchema = z
  .object({
    ...roomIdPayload,
    side: debateSideSchema,
  })
  .strict();

export const userSpeakingSocketSchema = z
  .object({
    ...roomIdPayload,
    speaking: z.boolean(),
  })
  .strict();

export const screenShareStateSocketSchema = z
  .object({
    ...roomIdPayload,
    sharing: z.boolean(),
    streamId: z.string().min(1).max(256).optional(),
    activity: z.boolean().optional(),
  })
  .strict()
  .refine((payload) => !payload.sharing || Boolean(payload.streamId), {
    path: ["streamId"],
    message: "A stream ID is required while sharing.",
  });

export const userMuteStatusSocketSchema = z
  .object({
    ...roomIdPayload,
    isUnMuted: z.boolean(),
  })
  .strict();

export const targetMemberSocketSchema = z
  .object({
    ...roomIdPayload,
    targetUserId: socketUserIdSchema,
  })
  .strict();

export const setModeratorRoleSocketSchema = z
  .object({
    ...roomIdPayload,
    targetUserId: socketUserIdSchema,
    isModerator: z.boolean(),
  })
  .strict();

export const moderatorSetMuteAllSocketSchema = z
  .object({
    ...roomIdPayload,
    muteAll: z.boolean(),
  })
  .strict();

export const moderatorSetCameraSocketSchema = z
  .object({
    ...roomIdPayload,
    cameraEnabled: z.boolean(),
  })
  .strict();

export const moderatorSetMemberCameraSocketSchema = z
  .object({
    ...roomIdPayload,
    targetUserId: socketUserIdSchema,
    cameraEnabled: z.boolean(),
  })
  .strict();

export const cameraStateSocketSchema = z
  .object({
    ...roomIdPayload,
    cameraEnabled: z.boolean(),
    activity: z.boolean().default(true),
  })
  .strict();

export const endRoomSocketSchema = z
  .object(roomIdPayload)
  .strict();

const peerSocketIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[\w-]+$/);

const sessionDescriptionSchema = z
  .object({
    type: z.enum(["offer", "answer"]),
    sdp: z.string().min(1).max(256 * 1024),
  })
  .strict();

export const offerSocketSchema = z
  .object({
    to: peerSocketIdSchema,
    offer: sessionDescriptionSchema.extend({ type: z.literal("offer") }),
  })
  .strict();

export const answerSocketSchema = z
  .object({
    to: peerSocketIdSchema,
    answer: sessionDescriptionSchema.extend({ type: z.literal("answer") }),
  })
  .strict();

export const iceCandidateSocketSchema = z
  .object({
    to: peerSocketIdSchema,
    candidate: z
      .object({
        candidate: z.string().max(8192),
        sdpMid: z.string().max(256).nullable().optional(),
        sdpMLineIndex: z.number().int().nonnegative().max(65535).nullable().optional(),
        usernameFragment: z.string().max(256).nullable().optional(),
      })
      .strict(),
  })
  .strict();

export const socketEventSchemas = {
  "join-room": joinRoomSocketSchema,
  "change-debate-side": changeMemberSideSocketSchema,
  offer: offerSocketSchema,
  answer: answerSocketSchema,
  "ice-candidate": iceCandidateSocketSchema,
  "user-speaking": userSpeakingSocketSchema,
  "screen-share-state": screenShareStateSocketSchema,
  "user-mute-status": userMuteStatusSocketSchema,
  "leave-room": leaveRoomSocketSchema,
  "kick-member": targetMemberSocketSchema,
  "set-moderator-role": setModeratorRoleSocketSchema,
  "moderator-mute-user": targetMemberSocketSchema,
  "moderator-unmute-user": targetMemberSocketSchema,
  "moderator-set-mute-all": moderatorSetMuteAllSocketSchema,
  "moderator-set-camera": moderatorSetCameraSocketSchema,
  "moderator-set-member-camera": moderatorSetMemberCameraSocketSchema,
  "camera-state": cameraStateSocketSchema,
  "end-room": endRoomSocketSchema,
  sendMessage: sendMessageSocketSchema,
} as const;

export type SocketEventName = keyof typeof socketEventSchemas;
