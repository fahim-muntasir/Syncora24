import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { canModerateRoom } from "../utils/canModarateRoom";
import { removeMember, findSingleItem, endRoom, addMember } from "../lib/room";
import {
  muteUser,
  unmuteUser,
  setMuteAll,
  getRoomModerationState,
} from "../lib/moderation";

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
        { roomId, user },
        callback?: (response: { success: boolean; message?: string }) => void,
      ) => {
        try {
          console.log(`[Socket] ${user.id} joining realtime room ${roomId}`);

          // Prevent duplicate joining
          if (socket.data.roomId === roomId && socket.rooms.has(roomId)) {
            callback?.({
              success: true,
              message: "Already joined room",
            });

            return;
          }

          // 1. Validate room exists
          const room = await findSingleItem(roomId);

          if (!room) {
            callback?.({
              success: false,
              message: "Room not found",
            });

            return;
          }

          // Optional: prevent joining ended room
          if (room.isEnded) {
            callback?.({
              success: false,
              message: "This room has ended",
            });

            return;
          }

          // 2. Check capacity
          const existingMember = room.members?.some(
            (member: { id: string }) => member.id === user.id,
          );

          if (!existingMember && room.members.length >= room.maxParticipants) {
            callback?.({
              success: false,
              message: "Room is full",
            });

            return;
          }

          // 3. Add member to database FIRST
          if (!existingMember) {
            await addMember({
              roomId,
              member: {
                id: user.id,
                name: user.name,
              },
            });
          }

          // 4. Get existing realtime participants BEFORE joining
          const existingSockets = await io?.in(roomId).fetchSockets();

          const existingUsers = (existingSockets ?? [])
            .filter((existingSocket) => existingSocket.id !== socket.id)
            .map((existingSocket) => ({
              user: {
                id: existingSocket.data.userId,
                name: existingSocket.data.userName,
              },
              socketId: existingSocket.id,
            }))
            .filter((item) => item.user.id);

          // 5. Join Socket.IO rooms
          socket.join(roomId);

          socket.join(`user:${user.id}`);

          // 6. Store socket metadata
          socket.data.roomId = roomId;
          socket.data.userId = user.id;
          socket.data.userName = user.name;
          socket.data.socketId = socket.id;

          // 7. Get moderation state
          const moderationState = await getRoomModerationState(roomId);

          // 8. Send state to joining user
          socket.emit("room-force-muted-state", {
            roomId,
            ...moderationState,
          });

          // 9. Send existing realtime users to joining user
          socket.emit("room-participants", {
            roomId,
            participants: existingUsers,
          });

          // 10. Notify existing realtime users
          socket.to(roomId).emit("user-joined", {
            roomId,
            user,
            socketId: socket.id,
          });

          // 11. Update everyone listening to room data
          io?.emit("joinedMember", {
            roomId,
            newMember: {
              id: user.id,
              name: user.name,
            },
          });

          console.log(`[Socket] ${user.id} successfully joined ${roomId}`);

          // 12. Confirm success to the joining frontend
          callback?.({
            success: true,
            message: "Joined room successfully",
          });
        } catch (error) {
          console.error("[Socket] Failed to join room:", error);

          callback?.({
            success: false,
            message: "Failed to join room",
          });
        }
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
