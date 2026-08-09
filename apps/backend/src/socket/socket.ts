import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import redis from "../redis";
import { removeMember } from "../lib/room";
import { canModerateRoom } from "../utils/canModarateRoom";
import { findSingleItem } from "../lib/room";

let io: Server | null = null;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", async ({ roomId, user }) => {
      socket.join(roomId);
      socket.join(`user:${user.id}`);

      socket.data.roomId = roomId;
      socket.data.userId = user.id;
      socket.data.socketId = socket.id;

      const forceMutedUsers = await redis.smembers(
        `room:${roomId}:force-muted`,
      );

      // Tell the joining user the current persistent moderation state
      socket.to(`user:${user.id}`).emit("room-force-muted-state", {
        roomId,
        forceMutedUsers,
      });

      // Tell everyone that a new user joined
      socket.to(roomId).emit("user-joined", {
        roomId,
        user,
        socketId: socket.id,
      });
    });

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

    // 🗣 Handle user speaking status
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

    socket.on("sendMessage", ({ roomId, message }) => {
      const senderId = socket.data.userId;

      // Log who is in the room
      const room = io?.sockets.adapter.rooms.get(roomId);
      console.log("Room members before sending:", Array.from(room || []));

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

        await redis.sadd(`room:${roomId}:force-muted`, targetUserId);

        // Notify the target immediately
        io?.to(`user:${targetUserId}`).emit("member-force-muted", {
          roomId,
          userId: targetUserId,
          forceMuted: true,
        });

        // Update everyone else's UI
        io?.to(roomId).emit("member-force-mute-status", {
          userId: targetUserId,
          forceMuted: true,
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

      await redis.srem(`room:${roomId}:force-muted`, targetUserId);

      io?.to(`user:${targetUserId}`).emit("member-force-unmuted", {
        roomId,
        userId: targetUserId,
        forceMuted: false,
      });

      io?.to(roomId).emit("member-force-mute-status", {
        userId: targetUserId,
        forceMuted: false,
      });
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
