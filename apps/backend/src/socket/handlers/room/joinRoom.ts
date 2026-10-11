import { Namespace, Socket } from "socket.io";
import { addMember } from "../../../lib/room";
import { getRoomModerationState } from "../../../lib/moderation";
import { findSingleItem } from "../../../lib/room";
import type { DebateSide } from "../../../schemas/roomSchema";

type JoinRoomPayload = {
  roomId: string;
  side?: DebateSide;
  reconnectOnly?: boolean;
};

type JoinRoomResponse = {
  success: boolean;
  message?: string;
  code?: string;
};

export const handleJoinRoom = async (
  io: Namespace,
  publicIo: Namespace,
  socket: Socket,
  { roomId, side, reconnectOnly }: JoinRoomPayload,
): Promise<JoinRoomResponse> => {
  try {
    const user = {
      id: socket.data.user.id,
      name: socket.data.user.fullName,
    };
    console.log(`[Socket] ${user.id} joining realtime room ${roomId}`);

    // Prevent duplicate Socket.IO joining.
    if (socket.data.roomId === roomId && socket.rooms.has(roomId)) {
      return {
        success: true,
        message: "Already joined room",
      };
    }

    const memberResult = await addMember({
      roomId,
      member: {
        id: user.id,
        name: user.name,
        side,
      },
      reconnectOnly,
    });
    const room = await findSingleItem(roomId);

    
    // Get participants BEFORE adding this socket to the Socket.IO room.
    const existingSockets = await io.in(roomId).fetchSockets();
    const userAlreadyConnected = existingSockets.some(
      (existingSocket) => existingSocket.data.userId === user.id,
    );

    const existingUsers = existingSockets
      .filter((existingSocket) => existingSocket.id !== socket.id)
      .map((existingSocket) => ({
        user: {
          id: existingSocket.data.userId,
          name: existingSocket.data.userName,
          side: room?.members?.find(
            (member: { id: string }) => member.id === existingSocket.data.userId,
          )?.side,
        },
        socketId: existingSocket.id,
      }))
      .filter(
        (item, index, participants) =>
          item.user.id &&
          item.user.id !== user.id &&
          participants.findIndex(
            (participant) => participant.user.id === item.user.id,
          ) === index,
      );

    await socket.join(roomId);

    await socket.join(`user:${user.id}`);

    socket.data.roomId = roomId;
    socket.data.userId = user.id;
    socket.data.userName = user.name;
    socket.data.userSide = room?.members?.find(
      (member: { id: string }) => member.id === user.id,
    )?.side;
    socket.data.socketId = socket.id;

    const moderationState = await getRoomModerationState(roomId);
    io.to(roomId).emit("room-moderator-state", {
      roomId,
      moderatorIds: moderationState.moderatorIds,
      kickedMemberIds: moderationState.kickedMemberIds,
      cameraEnabled: moderationState.cameraEnabled,
      cameraDisabledMemberIds: moderationState.cameraDisabledMemberIds,
      cameraAllowedMemberIds: moderationState.cameraAllowedMemberIds,
    });

    // Send initial state to the joining user.

    socket.emit("room-force-muted-state", {
      roomId,
      ...moderationState,
    });

    socket.emit("room-participants", {
      roomId,
      participants: existingUsers,
    });

    for (const existingSocket of existingSockets) {
      if (!existingSocket.data.isScreenSharing) continue;
      socket.emit("screen-share-state", {
        roomId,
        userId: existingSocket.data.userId,
        userName: existingSocket.data.userName,
        sharing: true,
        streamId: existingSocket.data.screenShareStreamId,
      });
    }

    
    // Notify existing realtime participants.
    if (!userAlreadyConnected) {
      socket.to(roomId).emit("user-joined", {
        roomId,
        user: {
          id: user.id,
          name: user.name,
          side: socket.data.userSide,
        },
        socketId: socket.id,
      });
    }

    if (memberResult.added) {
      publicIo.emit("public-room-member-joined", {
        roomId,
        newMember: {
          id: user.id,
          name: user.name,
          side: socket.data.userSide,
        },
      });
      io.to(roomId).emit("room-member-joined", {
        roomId,
        newMember: {
          id: user.id,
          name: user.name,
          side: socket.data.userSide,
        },
      });
      io.to(roomId).emit("room-activity", {
        type: "member-joined",
        userId: user.id,
        userName: user.name,
        side: socket.data.userSide,
        timestamp: Date.now(),
      });
    } else if (memberResult.sideAssigned) {
      io.to(roomId).emit("room-member-side-updated", {
        roomId,
        memberId: user.id,
        side: socket.data.userSide,
      });
    }

    console.log(`[Socket] ${user.id} successfully joined ${roomId}`);

    return {
      success: true,
      message: memberResult.alreadyMember
        ? "Rejoined room successfully"
        : "Joined room successfully",
    };
  } catch (error) {
    console.error("[Socket] Failed to join room:", error);

    const message =
      error instanceof Error ? error.message : "Failed to join room";
    const code = message.includes("removed from this room")
      ? "MEMBER_KICKED"
      : message.includes("reconnection period has expired")
        ? "RECONNECT_WINDOW_EXPIRED"
        : undefined;

    return {
      success: false,
      message,
      code,
    };
  }
};
