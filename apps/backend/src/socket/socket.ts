import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { canModerateRoom } from "../utils/canModarateRoom";
import {
  removeMember,
  findSingleItem,
  endRoom,
  kickMember,
} from "../lib/room";
import {
  muteUser,
  unmuteUser,
  setMuteAll,
} from "../lib/moderation";

import { handleJoinRoom } from "./handlers/room/joinRoom";

let io: Server | null = null;

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
      socket.leave(roomId);

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
    });

    socket.on("kick-member", async ({ roomId, targetUserId }) => {
      try {
        await kickMember({
          roomId,
          actorId: socket.data.userId,
          targetId: targetUserId,
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
      } catch (error) {
        console.error("Failed to change mute-all state:", error);
      }
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
