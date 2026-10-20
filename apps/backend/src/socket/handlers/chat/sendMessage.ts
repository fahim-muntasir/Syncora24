import type { Socket } from "socket.io";
import { sendMessageSocketSchema } from "../../../schemas/socketSchema";
import { validateSocketPayload } from "../../validatePayload";

type RoomMember = {
  id: string;
  name: string;
};

type ChatRoom = {
  isEnded?: boolean;
  status?: string;
  members?: RoomMember[];
};

type SendMessageResponse = {
  success: boolean;
  message?: string;
  retryAfterMs?: number;
};

type ChatSocket = Pick<Socket, "data" | "rooms" | "emit">;

type SendMessageDependencies = {
  findRoom: (roomId: string) => Promise<ChatRoom | null>;
  isKicked: (roomId: string, userId: string) => Promise<boolean>;
};

export const handleSendMessage = async (
  socket: ChatSocket,
  payload: unknown,
  broadcast: (roomId: string, event: string, data: unknown) => void,
  dependencies: SendMessageDependencies,
  callback?: (response: SendMessageResponse) => void,
): Promise<void> => {
  const parsed = validateSocketPayload(
    socket,
    "sendMessage",
    sendMessageSocketSchema,
    payload,
    callback,
  );
  if (!parsed) return;

  const { roomId, message } = parsed;
  const user = socket.data.user;
  const userId = user?.id;
  if (
    !userId ||
    socket.data.roomId !== roomId ||
    socket.data.userId !== userId ||
    !socket.rooms.has(roomId)
  ) {
    callback?.({
      success: false,
      message: "You must be an active room member to send messages.",
    });
    return;
  }

  try {
    const [room, isKicked] = await Promise.all([
      dependencies.findRoom(roomId),
      dependencies.isKicked(roomId, userId),
    ]);
    const roomMember = room?.members?.find((member) => member.id === userId);

    if (
      !room ||
      room.isEnded === true ||
      room.status === "ended" ||
      isKicked ||
      !roomMember ||
      typeof roomMember.name !== "string" ||
      !roomMember.name.trim()
    ) {
      callback?.({
        success: false,
        message: "You must be an active room member to send messages.",
      });
      return;
    }

    broadcast(roomId, "messageReceived", {
      roomId,
      message: {
        ...message,
        senderName: roomMember.name,
      },
      senderId: userId,
      timestamp: Date.now(),
    });
    callback?.({ success: true });
  } catch (error) {
    console.error("[Socket] Failed to authorize chat message:", error);
    callback?.({
      success: false,
      message: "Unable to verify room membership. Please try again.",
    });
  }
};
