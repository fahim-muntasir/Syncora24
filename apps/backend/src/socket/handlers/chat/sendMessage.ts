import type { Socket } from "socket.io";
import { sendMessagePayloadSchema } from "../../../schemas/chatSchema";

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
};

type ChatSocket = Pick<Socket, "data" | "rooms">;

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
  const parsed = sendMessagePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    callback?.({ success: false, message: "Invalid chat message." });
    return;
  }

  const { roomId, message } = parsed.data;
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
