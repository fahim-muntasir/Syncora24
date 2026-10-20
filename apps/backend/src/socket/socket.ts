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
import { handleSendMessage } from "./handlers/chat/sendMessage";
import { authenticateRoomSocket } from "./authenticateRoomSocket";
import redis from "../redis";
import {
  answerSocketSchema,
  cameraStateSocketSchema,
  changeMemberSideSocketSchema,
  endRoomSocketSchema,
  iceCandidateSocketSchema,
  joinRoomSocketSchema,
  leaveRoomSocketSchema,
  moderatorSetCameraSocketSchema,
  moderatorSetMemberCameraSocketSchema,
  moderatorSetMuteAllSocketSchema,
  offerSocketSchema,
  screenShareStateSocketSchema,
  sendMessageSocketSchema,
  setModeratorRoleSocketSchema,
  targetMemberSocketSchema,
  userMuteStatusSocketSchema,
  userSpeakingSocketSchema,
} from "../schemas/socketSchema";
import { withMemberTransition } from "./memberTransitionQueue";
import { validateSocketPayload } from "./validatePayload";
import { enforceSocketRateLimit, socketRatePolicies } from "./rateLimit";

let io: Server | null = null;
let publicIo: Namespace | null = null;
let roomIo: Namespace | null = null;
const DISCONNECT_GRACE_PERIOD_MS = 60_000;
const MAX_SOCKET_PAYLOAD_BYTES = 1024 * 1024;
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

const emitRoomActivity = (
  roomId: string,
  activity: Record<string, unknown>,
) => {
  roomIo
    ?.to(roomId)
    .emit("room-activity", { ...activity, timestamp: Date.now() });
};

const getMemberName = (
  room: { members?: { id: string; name: string }[] },
  userId: string,
) => room.members?.find((member) => member.id === userId)?.name ?? userId;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    maxHttpBufferSize: MAX_SOCKET_PAYLOAD_BYTES,
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
        payload: unknown,
        callback?: (response: {
          success: boolean;
          message?: string;
          code?: string;
          retryAfterMs?: number;
        }) => void,
      ) => {
        const parsedPayload = validateSocketPayload(
          socket,
          "join-room",
          joinRoomSocketSchema,
          payload,
          callback,
        );
        if (!parsedPayload) return;
        const { roomId, side, reconnectOnly } = parsedPayload;
        const userId = socket.data.user.id;
        if (
          !(await enforceSocketRateLimit(
            socket,
            "join-room",
            socketRatePolicies.roomJoin(userId, roomId),
            "closed",
            callback,
          ))
        ) {
          return;
        }
        try {
          const response = await withMemberTransition(
            getDisconnectKey(roomId, userId),
            async () => {
              const result = await handleJoinRoom(roomIo!, publicIo!, socket, {
                roomId,
                side,
                reconnectOnly,
              });

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
        callback?: (response: {
          success: boolean;
          message?: string;
          retryAfterMs?: number;
        }) => void,
      ) => {
        const parsedPayload = validateSocketPayload(
          socket,
          "change-debate-side",
          changeMemberSideSocketSchema,
          payload,
          callback,
        );
        if (!parsedPayload) return;
        const { roomId, side } = parsedPayload;
        if (
          !(await enforceSocketRateLimit(
            socket,
            "change-debate-side",
            socketRatePolicies.moderation(socket.data.user.id, roomId),
            "closed",
            callback,
          ))
        ) {
          return;
        }
        if (socket.data.roomId !== roomId) {
          callback?.({
            success: false,
            message: "Join the room before changing your position.",
          });
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
          const message =
            error instanceof Error
              ? error.message
              : "Unable to update your debate position.";
          callback?.({ success: false, message });
        }
      },
    );

    socket.on("offer", (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "offer",
        offerSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { to, offer } = parsedPayload;
      console.log("Forwarding offer to:", to);
      roomIo?.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "answer",
        answerSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { to, answer } = parsedPayload;
      roomIo?.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "ice-candidate",
        iceCandidateSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { to, candidate } = parsedPayload;
      roomIo?.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // Handle user speaking status
    socket.on("user-speaking", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "user-speaking",
        userSpeakingSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, speaking } = parsedPayload;
      if (socket.data.roomId !== roomId) return;
      const userId = socket.data.user.id;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "user-speaking",
          socketRatePolicies.speaking(userId, roomId),
          "open",
        ))
      ) {
        return;
      }
      console.log(`🎙 ${userId} ${speaking ? "started" : "stopped"} speaking`);

      // Broadcast to others in the same room
      socket.to(roomId).emit("user-speaking", { roomId, userId, speaking });
    });

    socket.on("screen-share-state", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "screen-share-state",
        screenShareStateSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, sharing, streamId, activity } = parsedPayload;
      if (socket.data.roomId !== roomId) return;

      const userId = socket.data.user.id;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "screen-share-state",
          socketRatePolicies.mediaState(userId, roomId),
          "open",
        ))
      ) {
        return;
      }
      const isSharing = sharing;
      const nextStreamId = isSharing ? streamId : undefined;
      const wasSharing = Boolean(socket.data.isScreenSharing);
      const didStateChange = wasSharing !== isSharing;

      // Drop duplicate events (same state, same stream).
      if (!didStateChange && socket.data.screenShareStreamId === nextStreamId) {
        return;
      }

      socket.data.isScreenSharing = isSharing;
      socket.data.screenShareStreamId = nextStreamId;

      roomIo?.to(roomId).emit("screen-share-state", {
        roomId,
        userId,
        userName: socket.data.userName ?? userId,
        sharing: isSharing,
        streamId: nextStreamId,
      });

      if (activity !== false && didStateChange) {
        emitRoomActivity(roomId, {
          type: isSharing ? "screen-share-started" : "screen-share-stopped",
          userId,
          userName: socket.data.userName ?? userId,
        });
      }
    });

    // mute user
    socket.on("user-mute-status", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "user-mute-status",
        userMuteStatusSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, isUnMuted } = parsedPayload;
      if (socket.data.roomId !== roomId) return;
      const userId = socket.data.user.id;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "user-mute-status",
          socketRatePolicies.mediaState(userId, roomId),
          "open",
        ))
      ) {
        return;
      }
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
        payload: unknown,
        callback?: (response: { success: boolean; message?: string }) => void,
      ) => {
        const parsedPayload = validateSocketPayload(
          socket,
          "leave-room",
          leaveRoomSocketSchema,
          payload,
          callback,
        );
        if (!parsedPayload) return;
        const { roomId } = parsedPayload;
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

    socket.on("kick-member", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "kick-member",
        targetMemberSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, targetUserId } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "kick-member",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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

    socket.on("set-moderator-role", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "set-moderator-role",
        setModeratorRoleSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, targetUserId, isModerator } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "set-moderator-role",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
      try {
        const result = await setModeratorRole({
          roomId,
          actorId: socket.data.userId,
          targetId: targetUserId,
          isModerator,
        });

        roomIo?.to(roomId).emit("room-moderator-updated", {
          roomId,
          memberId: targetUserId,
          isModerator: result.isModerator,
        });
        const room = await findSingleItem(roomId);
        if (room) {
          emitRoomActivity(roomId, {
            type: result.isModerator
              ? "moderator-promoted"
              : "moderator-removed",
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
    });

    socket.on(
      "sendMessage",
      async (
        payload: unknown,
        callback?: (response: {
          success: boolean;
          message?: string;
          retryAfterMs?: number;
        }) => void,
      ) => {
        const parsedPayload = validateSocketPayload(
          socket,
          "sendMessage",
          sendMessageSocketSchema,
          payload,
          callback,
        );
        if (!parsedPayload) return;
        if (
          !(await enforceSocketRateLimit(
            socket,
            "sendMessage",
            socketRatePolicies.chat(socket.data.user.id, parsedPayload.roomId),
            "closed",
            callback,
          ))
        ) {
          return;
        }
        void handleSendMessage(
          socket,
          parsedPayload,
          (roomId, event, data) => roomIo?.to(roomId).emit(event, data),
          {
            findRoom: findSingleItem,
            isKicked: async (roomId, userId) =>
              (await redis.sismember(
                `room:${roomId}:kicked-members`,
                userId,
              )) === 1,
          },
          callback,
        );
      },
    );

    socket.on("moderator-mute-user", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "moderator-mute-user",
        targetMemberSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, targetUserId } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "moderator-mute-user",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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

    socket.on("moderator-unmute-user", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "moderator-unmute-user",
        targetMemberSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, targetUserId } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "moderator-unmute-user",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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

    socket.on("moderator-set-mute-all", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "moderator-set-mute-all",
        moderatorSetMuteAllSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, muteAll } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "moderator-set-mute-all",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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

    socket.on("moderator-set-camera", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "moderator-set-camera",
        moderatorSetCameraSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, cameraEnabled } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "moderator-set-camera",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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

    socket.on("moderator-set-member-camera", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "moderator-set-member-camera",
        moderatorSetMemberCameraSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, targetUserId, cameraEnabled } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "moderator-set-member-camera",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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
            message:
              "Administrators and moderators always retain camera access.",
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
    });

    socket.on("camera-state", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "camera-state",
        cameraStateSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId, cameraEnabled, activity } = parsedPayload;
      if (socket.data.roomId !== roomId) return;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "camera-state",
          socketRatePolicies.mediaState(socket.data.user.id, roomId),
          "open",
        ))
      ) {
        return;
      }

      try {
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
          (await redis.sismember(`room:${roomId}:camera-allowed`, userId)) ===
          1;

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
      } catch (error) {
        console.error("[Socket] Failed to authorize camera state:", error);
      }
    });

    socket.on("end-room", async (payload: unknown) => {
      const parsedPayload = validateSocketPayload(
        socket,
        "end-room",
        endRoomSocketSchema,
        payload,
      );
      if (!parsedPayload) return;
      const { roomId } = parsedPayload;
      if (
        !(await enforceSocketRateLimit(
          socket,
          "end-room",
          socketRatePolicies.moderation(socket.data.user.id, roomId),
          "closed",
          undefined,
          "moderation-error",
        ))
      ) {
        return;
      }
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
          if (
            liveSockets.some(
              (liveSocket) => liveSocket.data.userId === memberId,
            )
          ) {
            clearPendingDisconnect(roomId, memberId);
            return;
          }

          roomIo?.to(roomId).emit("user-speaking", {
            roomId,
            userId: memberId,
            speaking: false,
          });
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
                publicIo?.emit("public-room-member-removed", {
                  roomId,
                  memberId,
                });
                roomIo
                  ?.to(roomId)
                  .emit("room-member-removed", { roomId, memberId });

                roomIo
                  ?.to(roomId)
                  .emit("user-left", { roomId, memberId, socketId });
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
