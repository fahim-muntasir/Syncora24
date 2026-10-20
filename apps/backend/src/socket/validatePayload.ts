import type { Socket } from "socket.io";
import type { z } from "zod";

export type ValidationAck = (response: {
  success: false;
  message: string;
}) => void;

export const validateSocketPayload = <Schema extends z.ZodType>(
  socket: Pick<Socket, "emit">,
  event: string,
  schema: Schema,
  payload: unknown,
  callback?: ValidationAck,
): z.infer<Schema> | undefined => {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }

  const message = `Invalid ${event} payload.`;
  if (callback) {
    callback({ success: false, message });
  } else {
    socket.emit("socket-validation-error", { event, message });
  }
  return undefined;
};
