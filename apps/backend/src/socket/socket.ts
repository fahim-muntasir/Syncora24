import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { canModerateRoom } from "../utils/canModarateRoom";
import {
  removeMember,
  findSingleItem,
  endRoom,
  kickMember,
  setModeratorRole,
} from "../lib/room";
import {
  muteUser,
  unmuteUser,
  setMuteAll,
  setCameraEnabled,
  setCameraMemberEnabled,
} from "../lib/moderation";

import { handleJoinRoom } from "./handlers/room/joinRoom";
import redis from "../redis";

let io: Server | null = null;

const emitRoomActivity = (roomId: string, activity: Record<string, unknown>) => {
  io?.to(roomId).emit("room-activity", { ...activity, timestamp: Date.now() });
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

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on(
      "join-room",
      async (
        payload,
        callback?: (response: {
          success: boolean;
          message?: string;
          code?: string;
        }) => void,
      ) => {
        const response = await handleJoinRoom(io!, socket, payload);

        callback?.(response);
      },
    );

    socket.on("offer", ({ to, offer }) => {
      console.log("Forwarding offer to:", to);
      io?.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      io?.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io?.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // Handle user speaking status
    socket.on("user-speaking", ({ roomId, userId, speaking }) => {
      console.log(`🎙 ${userId} ${speaking ? "started" : "stopped"} speaking`);

      // Broadcast to others in the same room
      socket.to(roomId).emit("user-speaking", { roomId, userId, speaking });
    });

    // mute user
    socket.on("user-mute-status", ({ roomId, userId, isUnMuted }) => {
      console.log(
        `🎙 ${userId} ${isUnMuted ? "unmuted" : "muted"} microphone room: ${roomId}`,
      );

      // Broadcast to others in the same room
      socket.to(roomId).emit("user-mute-status", { roomId, userId, isUnMuted });
    });

    socket.on("leave-room", async ({ roomId, memberId }) => {
      const room = await findSingleItem(roomId);
      const userName = socket.data.userName ?? getMemberName(room ?? {}, memberId);
      socket.leave(roomId);
      socket.data.roomId = undefined;

      try {
        await removeMember({ roomId, memberId });

        io?.emit("removedMember", {
          roomId,
          memberId,
        });
      } catch (err) {
        console.error("Failed to remove member:", err);
      }

      io?.to(roomId).emit("user-left", {
        roomId,
        memberId,
        socketId: socket.id,
      });
      emitRoomActivity(roomId, { type: "member-left", userId: memberId, userName });
    });

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
        emitRoomActivity(roomId, {
          type: "member-kicked",
          userId: targetUserId,
          userName: getMemberName(room, targetUserId),
          actorId,
          actorName: socket.data.userName ?? actorId,
        });

        const targetSockets = (await io!.in(roomId).fetchSockets()).filter(
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

        io?.emit("removedMember", { roomId, memberId: targetUserId });
        io?.to(roomId).emit("user-left", {
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

          io?.to(roomId).emit("room-moderator-updated", {
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

      io?.to(roomId).emit("messageReceived", {
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
        io?.to(`user:${targetUserId}`).emit("member-force-muted", result);

        // Update everyone else's UI
        io?.to(roomId).emit("member-force-mute-status", result);
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

      io?.to(`user:${targetUserId}`).emit("member-force-unmuted", result);

      io?.to(roomId).emit("member-force-mute-status", result);
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
        io?.to(roomId).emit("room-mute-all-state", {
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
        io?.to(roomId).emit("room-camera-state", {
          roomId,
          cameraEnabled: enabled,
        });
        if (!enabled) {
          const roomSockets = await io!.in(roomId).fetchSockets();
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
          io?.to(roomId).emit("room-member-camera-state", {
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

    socket.on("camera-state", async ({ roomId, cameraEnabled }) => {
      if (socket.data.roomId !== roomId) return;

      const room = await findSingleItem(roomId);
      if (!room) return;

      const userId = socket.data.userId;
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

      io?.to(roomId).emit("camera-state", {
        roomId,
        userId,
        cameraEnabled: Boolean(cameraEnabled),
      });
      emitRoomActivity(roomId, {
        type: cameraEnabled ? "camera-started" : "camera-stopped",
        userId,
        userName: socket.data.userName ?? userId,
      });
    });

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

        io?.to(roomId).emit("room-ended-for-members", {
          roomId,
          endedBy: userId,
        });
        emitRoomActivity(roomId, {
          type: "room-ended",
          actorId: userId,
          actorName: socket.data.userName ?? userId,
        });

        io?.emit("room-ended", {
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
      const socketId = socket.data.socketId;

      console.log("User disconnected from room:", roomId, memberId);

      if (roomId && memberId) {
        await removeMember({ roomId, memberId }); // ✅ cleanup in DB

        io?.emit("removedMember", {
          roomId,
          memberId,
        });

        io?.to(roomId).emit("user-left", { roomId, memberId, socketId });
        emitRoomActivity(roomId, {
          type: "member-left",
          userId: memberId,
          userName: socket.data.userName ?? memberId,
        });
      }
    });
  });
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error("Socket.IO is not initialized!");
  }
  return io;
};
