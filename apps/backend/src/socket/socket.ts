import { Namespace, Server } from "socket.io";
import { Server as HttpServer } from "http";
import { canModerateRoom } from "../utils/canModarateRoom";
import {
  removeMember,
  findSingleItem,
  endRoom,
  kickMember,
  setModeratorRole,
  setMemberSide,
} from "../lib/room";
import {
  muteUser,
  unmuteUser,
  setMuteAll,
  setCameraEnabled,
  setCameraMemberEnabled,
} from "../lib/moderation";

import { handleJoinRoom } from "./handlers/room/joinRoom";
import { authenticateRoomSocket } from "./authenticateRoomSocket";
import redis from "../redis";
import {
  changeMemberSideSchema,
  type DebateSide,
} from "../schemas/roomSchema";
import { withMemberTransition } from "./memberTransitionQueue";

let io: Server | null = null;
let publicIo: Namespace | null = null;
let roomIo: Namespace | null = null;
const DISCONNECT_GRACE_PERIOD_MS = 60_000;
const pendingDisconnects = new Map<string, ReturnType<typeof setTimeout>>();

const getDisconnectKey = (roomId: string, userId: string) =>
  `${roomId}:${userId}`;

const clearPendingDisconnect = (roomId: string, userId: string) => {
  const key = getDisconnectKey(roomId, userId);
  const timer = pendingDisconnects.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingDisconnects.delete(key);
  }
};

const emitRoomActivity = (roomId: string, activity: Record<string, unknown>) => {
  roomIo?.to(roomId).emit("room-activity", { ...activity, timestamp: Date.now() });
};

const getMemberName = (
  room: { members?: { id: string; name: string }[] },
  userId: string,
) => room.members?.find((member) => member.id === userId)?.name ?? userId;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  publicIo = io.of("/public");
  roomIo = io.of("/room");
  authenticateRoomSocket(roomIo);

  roomIo.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on(
      "join-room",
      async (
        {
          roomId,
          side,
          reconnectOnly,
        }: { roomId: string; side?: DebateSide; reconnectOnly?: boolean },
        callback?: (response: {
          success: boolean;
          message?: string;
          code?: string;
        }) => void,
      ) => {
        const userId = socket.data.user.id;
        try {
          const response = await withMemberTransition(
            getDisconnectKey(roomId, userId),
            async () => {
              const result = await handleJoinRoom(
                roomIo!,
                publicIo!,
                socket,
                { roomId, side, reconnectOnly },
              );

              if (result.success) {
                clearPendingDisconnect(roomId, userId);
                roomIo?.to(roomId).emit("participant-connection-state", {
                  roomId,
                  userId,
                  state: "connected",
                });
              }

              return result;
            },
          );
          callback?.(response);
        } catch (error) {
          console.error(`[Socket] Failed to join room ${roomId}:`, error);
          callback?.({
            success: false,
            message: "Unable to join the room. Please try again.",
          });
        }
      },
    );

    socket.on(
      "change-debate-side",
      async (
        payload: unknown,
        callback?: (response: { success: boolean; message?: string }) => void,
      ) => {
        const parsedPayload = changeMemberSideSchema.safeParse(payload);
        if (!parsedPayload.success) {
          callback?.({ success: false, message: "Choose For or Against." });
          return;
        }
        const { roomId, side } = parsedPayload.data;
        if (socket.data.roomId !== roomId) {
          callback?.({ success: false, message: "Join the room before changing your position." });
          return;
        }

        try {
          const result = await setMemberSide({
            roomId,
            memberId: socket.data.user.id,
            side,
          });
          socket.data.userSide = side;

          roomIo?.to(roomId).emit("room-member-side-updated", {
            roomId,
            memberId: socket.data.user.id,
            side,
          });
          publicIo?.emit("public-room-member-side-updated", {
            roomId,
            memberId: socket.data.user.id,
            side,
          });
          if (result.previousSide && result.previousSide !== side) {
            emitRoomActivity(roomId, {
              type: "member-side-changed",
              userId: socket.data.user.id,
              userName: socket.data.userName ?? socket.data.user.id,
              previousSide: result.previousSide,
              side,
            });
          }

          callback?.({ success: true });
        } catch (error) {
          const message = error instanceof Error
            ? error.message
            : "Unable to update your debate position.";
          callback?.({ success: false, message });
        }
      },
    );

    socket.on("offer", ({ to, offer }) => {
      console.log("Forwarding offer to:", to);
      roomIo?.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      roomIo?.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      roomIo?.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // Handle user speaking status
    socket.on("user-speaking", ({ roomId, speaking }) => {
      if (socket.data.roomId !== roomId) return;
      const userId = socket.data.user.id;
      console.log(`🎙 ${userId} ${speaking ? "started" : "stopped"} speaking`);

      // Broadcast to others in the same room
      socket.to(roomId).emit("user-speaking", { roomId, userId, speaking });
    });

    socket.on(
      "screen-share-state",
      ({ roomId, sharing, streamId, activity = true }) => {
        if (!roomId || socket.data.roomId !== roomId) return;
        const userId = socket.data.user.id;
        const isSharing = Boolean(sharing);
        const didStateChange = Boolean(socket.data.isScreenSharing) !== isSharing;

        socket.data.isScreenSharing = isSharing;
        socket.data.screenShareStreamId = sharing ? streamId : undefined;

        roomIo?.to(roomId).emit("screen-share-state", {
          roomId,
          userId,
          userName: socket.data.userName ?? userId,
          sharing: isSharing,
          streamId,
        });
        if (activity && didStateChange) {
          emitRoomActivity(roomId, {
            type: isSharing ? "screen-share-started" : "screen-share-stopped",
            userId,
            userName: socket.data.userName ?? userId,
          });
        }
      },
    );

    // mute user
    socket.on("user-mute-status", ({ roomId, isUnMuted }) => {
      if (socket.data.roomId !== roomId) return;
      const userId = socket.data.user.id;
      console.log(
        `🎙 ${userId} ${isUnMuted ? "unmuted" : "muted"} microphone room: ${roomId}`,
      );

      // Broadcast to others in the same room
      socket.to(roomId).emit("user-mute-status", { roomId, userId, isUnMuted });
      emitRoomActivity(roomId, {
        type: isUnMuted ? "microphone-started" : "microphone-stopped",
        userId,
        userName: socket.data.userName ?? userId,
      });
    });

    socket.on(
      "leave-room",
      async (
        { roomId }: { roomId: string },
        callback?: (response: { success: boolean; message?: string }) => void,
      ) => {
        const memberId = socket.data.user.id;
        try {
          await withMemberTransition(
            getDisconnectKey(roomId, memberId),
            async () => {
              if (socket.data.roomId !== roomId) return;

              clearPendingDisconnect(roomId, memberId);
              const room = await findSingleItem(roomId);
              const userName =
                socket.data.userName ?? getMemberName(room ?? {}, memberId);

              await removeMember({ roomId, memberId });
              const memberSockets = (
                await roomIo!.in(roomId).fetchSockets()
              ).filter((roomSocket) => roomSocket.data.userId === memberId);
              const wasScreenSharing = memberSockets.some((roomSocket) =>
                Boolean(roomSocket.data.isScreenSharing),
              );

              if (wasScreenSharing) {
                roomIo?.to(roomId).emit("screen-share-state", {
                  roomId,
                  userId: memberId,
                  sharing: false,
                });
              }

              publicIo?.emit("public-room-member-removed", {
                roomId,
                memberId,
              });
              roomIo?.to(roomId).emit("room-member-removed", {
                roomId,
                memberId,
              });

              roomIo?.to(roomId).emit("user-left", {
                roomId,
                memberId,
                socketId: socket.id,
              });

              for (const memberSocket of memberSockets) {
                memberSocket.data.roomId = undefined;
                memberSocket.data.isScreenSharing = false;
                memberSocket.data.screenShareStreamId = undefined;
                await memberSocket.leave(roomId);
              }

              emitRoomActivity(roomId, {
                type: "member-left",
                userId: memberId,
                userName,
              });
            },
          );
          callback?.({ success: true });
        } catch (error) {
          console.error(`[Socket] Failed to leave room ${roomId}:`, error);
          callback?.({
            success: false,
            message: "Unable to leave the room. Please try again.",
          });
        }
      },
    );

    socket.on("kick-member", async ({ roomId, targetUserId }) => {
      try {
        const room = await findSingleItem(roomId);
        if (!room) throw new Error("Room not found.");
        const actorId = socket.data.userId;
        await kickMember({
          roomId,
          actorId,
          targetId: targetUserId,
        });
        clearPendingDisconnect(roomId, targetUserId);
        emitRoomActivity(roomId, {
          type: "member-kicked",
          userId: targetUserId,
          userName: getMemberName(room, targetUserId),
          actorId,
          actorName: socket.data.userName ?? actorId,
        });

        const targetSockets = (await roomIo!.in(roomId).fetchSockets()).filter(
          (targetSocket) => targetSocket.data.userId === targetUserId,
        );

        for (const targetSocket of targetSockets) {
          targetSocket.emit("room-member-kicked", {
            roomId,
            memberId: targetUserId,
          });
          targetSocket.data.roomId = undefined;
          await targetSocket.leave(roomId);
          targetSocket.emit("user-left", {
            roomId,
            memberId: targetUserId,
            socketId: targetSocket.id,
          });
        }

        publicIo?.emit("public-room-member-removed", {
          roomId,
          memberId: targetUserId,
        });
        roomIo?.to(roomId).emit("room-member-removed", {
          roomId,
          memberId: targetUserId,
        });
        roomIo?.to(roomId).emit("user-left", {
          roomId,
          memberId: targetUserId,
          socketId: targetSockets[0]?.id,
        });
      } catch (error) {
        socket.emit("moderation-error", {
          message:
            error instanceof Error
              ? error.message
              : "Unable to kick this member.",
        });
      }
    });

    socket.on(
      "set-moderator-role",
      async ({ roomId, targetUserId, isModerator }) => {
        try {
          const result = await setModeratorRole({
            roomId,
            actorId: socket.data.userId,
            targetId: targetUserId,
            isModerator: Boolean(isModerator),
          });

          roomIo?.to(roomId).emit("room-moderator-updated", {
            roomId,
            memberId: targetUserId,
            isModerator: result.isModerator,
          });
          const room = await findSingleItem(roomId);
          if (room) {
            emitRoomActivity(roomId, {
              type: result.isModerator ? "moderator-promoted" : "moderator-removed",
              userId: targetUserId,
              userName: getMemberName(room, targetUserId),
              actorId: socket.data.userId,
              actorName: socket.data.userName ?? socket.data.userId,
            });
          }
        } catch (error) {
          socket.emit("moderation-error", {
            message:
              error instanceof Error
                ? error.message
                : "Unable to update moderator role.",
          });
        }
      },
    );

    socket.on("sendMessage", ({ roomId, message }) => {
      const senderId = socket.data.userId;

      roomIo?.to(roomId).emit("messageReceived", {
        roomId,
        message,
        senderId,
        timestamp: Date.now(),
      });
    });

    socket.on("moderator-mute-user", async ({ roomId, targetUserId }) => {
      try {
        const moderatorId = socket.data.userId;

        const allowed = await canModerateRoom(roomId, moderatorId);

        if (!allowed) {
          socket.emit("moderation-error", {
            message: "You don't have permission to mute members.",
          });

          return;
        }

        const room = await findSingleItem(roomId);

        if (!room) {
          return;
        }

        // Never allow moderator to mute host
        if (room.hostId === targetUserId) {
          return;
        }

        const result = await muteUser(roomId, targetUserId);

        // Notify the target immediately
        roomIo?.to(`user:${targetUserId}`).emit("member-force-muted", result);

        // Update everyone else's UI
        roomIo?.to(roomId).emit("member-force-mute-status", result);
        emitRoomActivity(roomId, {
          type: "member-muted",
          userId: targetUserId,
          userName: getMemberName(room, targetUserId),
          actorId: moderatorId,
          actorName: socket.data.userName ?? moderatorId,
        });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("moderator-unmute-user", async ({ roomId, targetUserId }) => {
      const moderatorId = socket.data.userId;

      const allowed = await canModerateRoom(roomId, moderatorId);

      if (!allowed) {
        return;
      }

      const result = await unmuteUser(roomId, targetUserId);

      roomIo?.to(`user:${targetUserId}`).emit("member-force-unmuted", result);

      roomIo?.to(roomId).emit("member-force-mute-status", result);
      const room = await findSingleItem(roomId);
      if (room) {
        emitRoomActivity(roomId, {
          type: "member-unmuted",
          userId: targetUserId,
          userName: getMemberName(room, targetUserId),
          actorId: moderatorId,
          actorName: socket.data.userName ?? moderatorId,
        });
      }
    });

    socket.on("moderator-set-mute-all", async ({ roomId, muteAll }) => {
      try {
        const moderatorId = socket.data.userId;

        const allowed = await canModerateRoom(roomId, moderatorId);

        if (!allowed) {
          socket.emit("moderation-error", {
            message: "You don't have permission to mute everyone.",
          });

          return;
        }

        const room = await findSingleItem(roomId);

        if (!room) return;

        await setMuteAll(roomId, muteAll);

        const muteAllExcludedUsers = muteAll ? [room.hostId] : [];

        // Tell everyone currently in the room
        roomIo?.to(roomId).emit("room-mute-all-state", {
          roomId,
          muteAll,
          muteAllExcludedUsers,
        });
        emitRoomActivity(roomId, {
          type: muteAll ? "mute-all-enabled" : "mute-all-disabled",
          actorId: moderatorId,
          actorName: socket.data.userName ?? moderatorId,
        });
      } catch (error) {
        console.error("Failed to change mute-all state:", error);
      }
    });

    socket.on("moderator-set-camera", async ({ roomId, cameraEnabled }) => {
      try {
        const allowed = await canModerateRoom(roomId, socket.data.userId);
        if (!allowed) {
          socket.emit("moderation-error", {
            message: "You don't have permission to change camera access.",
          });
          return;
        }

        const enabled = await setCameraEnabled(roomId, Boolean(cameraEnabled));
        roomIo?.to(roomId).emit("room-camera-state", {
          roomId,
          cameraEnabled: enabled,
        });
        if (!enabled) {
          const roomSockets = await roomIo!.in(roomId).fetchSockets();
          for (const roomSocket of roomSockets) {
            const isPrivileged = await canModerateRoom(
              roomId,
              roomSocket.data.userId,
            );
            if (!isPrivileged) {
              roomSocket.emit("room-camera-force-stop", { roomId });
            }
          }
        }
        emitRoomActivity(roomId, {
          type: "camera-permission-changed",
          userId: socket.data.userId,
          userName: socket.data.userName ?? socket.data.userId,
          actorId: socket.data.userId,
          actorName: socket.data.userName ?? socket.data.userId,
          enabled,
          scope: "room",
        });
      } catch (error) {
        console.error("Failed to change camera access:", error);
        socket.emit("moderation-error", {
          message: "Unable to change camera access.",
        });
      }
    });

    socket.on(
      "moderator-set-member-camera",
      async ({ roomId, targetUserId, cameraEnabled }) => {
        try {
          if (!(await canModerateRoom(roomId, socket.data.userId))) {
            socket.emit("moderation-error", {
              message: "You don't have permission to change camera access.",
            });
            return;
          }

          const room = await findSingleItem(roomId);
          if (
            !room ||
            !room.members.some(
              (member: { id: string }) => member.id === targetUserId,
            )
          ) {
            return;
          }

          const targetIsPrivileged =
            room.hostId === targetUserId ||
            (await canModerateRoom(roomId, targetUserId));
          if (targetIsPrivileged) {
            socket.emit("moderation-error", {
              message: "Administrators and moderators always retain camera access.",
            });
            return;
          }

          const enabled = await setCameraMemberEnabled(
            roomId,
            targetUserId,
            Boolean(cameraEnabled),
          );
          roomIo?.to(roomId).emit("room-member-camera-state", {
            roomId,
            memberId: targetUserId,
            cameraEnabled: enabled,
          });
          emitRoomActivity(roomId, {
            type: "camera-permission-changed",
            userId: targetUserId,
            userName: getMemberName(room, targetUserId),
            actorId: socket.data.userId,
            actorName: socket.data.userName ?? socket.data.userId,
            enabled,
            scope: "member",
          });
        } catch (error) {
          console.error("Failed to change member camera access:", error);
          socket.emit("moderation-error", {
            message: "Unable to change member camera access.",
          });
        }
      },
    );

    socket.on(
      "camera-state",
      async ({
        roomId,
        cameraEnabled,
        activity = true,
      }: {
        roomId: string;
        cameraEnabled: boolean;
        activity?: boolean;
      }) => {
        if (socket.data.roomId !== roomId) return;

        const room = await findSingleItem(roomId);
        if (!room) return;

        const userId = socket.data.user.id;
        const privileged =
          room.hostId === userId || (await canModerateRoom(roomId, userId));
        const memberCameraDisabled = await redis.sismember(
          `room:${roomId}:camera-disabled`,
          userId,
        );
        const roomCameraDisabled =
          (await redis.get(`room:${roomId}:camera-enabled`)) === "0";
        const memberCameraAllowed =
          (await redis.sismember(`room:${roomId}:camera-allowed`, userId)) === 1;

        if (
          cameraEnabled &&
          (memberCameraDisabled === 1 ||
            (roomCameraDisabled && !memberCameraAllowed && !privileged))
        ) {
          socket.emit("camera-state", { roomId, userId, cameraEnabled: false });
          return;
        }

        roomIo?.to(roomId).emit("camera-state", {
          roomId,
          userId,
          cameraEnabled: Boolean(cameraEnabled),
        });
        if (activity) {
          emitRoomActivity(roomId, {
            type: cameraEnabled ? "camera-started" : "camera-stopped",
            userId,
            userName: socket.data.userName ?? userId,
          });
        }
      },
    );

    socket.on("end-room", async ({ roomId }) => {
      try {
        const userId = socket.data.userId;

        const room = await findSingleItem(roomId);

        if (!room) {
          socket.emit("moderation-error", {
            message: "Room not found.",
          });

          return;
        }

        if (room.hostId !== userId) {
          socket.emit("moderation-error", {
            message: "Only the host can end this room.",
          });

          return;
        }

        await endRoom(roomId);

        roomIo?.to(roomId).emit("room-ended-for-members", {
          roomId,
          endedBy: userId,
        });
        emitRoomActivity(roomId, {
          type: "room-ended",
          actorId: userId,
          actorName: socket.data.userName ?? userId,
        });

        publicIo?.emit("public-room-ended", {
          roomId,
          endedBy: userId,
        });
      } catch (error) {
        console.error("Failed to end room:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      const roomId = socket.data.roomId;
      const memberId = socket.data.userId;
      if (!roomId || !memberId) return;

      console.log("User disconnected from room:", roomId, memberId);
      const key = getDisconnectKey(roomId, memberId);

      try {
        await withMemberTransition(key, async () => {
          if (socket.data.roomId !== roomId) return;

          const wasScreenSharing = Boolean(socket.data.isScreenSharing);
          if (wasScreenSharing) {
            socket.data.isScreenSharing = false;
            socket.data.screenShareStreamId = undefined;
            roomIo?.to(roomId).emit("screen-share-state", {
              roomId,
              userId: memberId,
              sharing: false,
            });
          }

          const liveSockets = await roomIo!.in(roomId).fetchSockets();
          if (liveSockets.some((liveSocket) => liveSocket.data.userId === memberId)) {
            clearPendingDisconnect(roomId, memberId);
            return;
          }

          roomIo?.to(roomId).emit("participant-connection-state", {
            roomId,
            userId: memberId,
            state: "connection-lost",
          });

          clearPendingDisconnect(roomId, memberId);
          const socketId = socket.id;
          const userName = socket.data.userName ?? memberId;

          const timer = setTimeout(() => {
            void withMemberTransition(key, async () => {
              if (pendingDisconnects.get(key) !== timer) return;

              try {
                const currentSockets = await roomIo!.in(roomId).fetchSockets();
                if (
                  currentSockets.some(
                    (currentSocket) => currentSocket.data.userId === memberId,
                  )
                ) {
                  clearPendingDisconnect(roomId, memberId);
                  roomIo?.to(roomId).emit("participant-connection-state", {
                    roomId,
                    userId: memberId,
                    state: "connected",
                  });
                  return;
                }

                await removeMember({ roomId, memberId });
                clearPendingDisconnect(roomId, memberId);
                publicIo?.emit("public-room-member-removed", { roomId, memberId });
                roomIo?.to(roomId).emit("room-member-removed", { roomId, memberId });

                roomIo?.to(roomId).emit("user-left", { roomId, memberId, socketId });
                emitRoomActivity(roomId, {
                  type: "member-left",
                  userId: memberId,
                  userName,
                });
              } catch (error) {
                console.error(
                  `[Socket] Failed to clean up disconnected member ${memberId}:`,
                  error,
                );
                clearPendingDisconnect(roomId, memberId);
              }
            }).catch((error: unknown) => {
              console.error(
                `[Socket] Failed to finalize disconnect for ${memberId}:`,
                error,
              );
            });
          }, DISCONNECT_GRACE_PERIOD_MS);

          pendingDisconnects.set(key, timer);
        });
      } catch (error) {
        console.error(
          `[Socket] Failed to handle disconnect for ${memberId}:`,
          error,
        );
      }
    });
  });
};

export const getPublicIo = (): Namespace => {
  if (!publicIo) {
    throw new Error("Socket.IO is not initialized!");
  }
  return publicIo;
};
