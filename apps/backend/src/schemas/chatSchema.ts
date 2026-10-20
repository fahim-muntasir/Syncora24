import { z } from "zod";

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_MEDIA_URL_LENGTH = 2048;

const mediaUrlSchema = z
  .string()
  .max(MAX_MEDIA_URL_LENGTH)
  .url()
  .refine((value) => ["http:", "https:", "blob:"].includes(new URL(value).protocol));

export const chatMessageSchema = z
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

export const sendMessagePayloadSchema = z.object({
  roomId: z.string().uuid(),
  message: chatMessageSchema,
}).strict();