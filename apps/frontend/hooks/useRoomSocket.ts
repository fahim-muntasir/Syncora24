import { useEffect, useRef, useCallback, useState } from "react";
import { roomSocketManager } from "@/libs/socket/index";
import { PeerManager } from "@/libs/webrtc/PeerManager";
import { useAudio } from "@/context/AudioContext";
import {
  setForceMutedUsers,
  setForceMutedUser,
  removeForceMutedUser,
  setMuteAll,
  setMuteAllExcludedUsers,
  setModeratorIds,
  setKickedMemberIds,
  addKickedMemberId,
  clearUnMutedUsersExcept,
  setVolumeLevel,
  removeVolumeLevel,
  removeUnMutedUser,
  removeSpeakingUser,
  setCameraEnabled,
  setCameraDisabledMemberIds,
  addCameraDisabledMemberId,
  removeCameraDisabledMemberId,
  setCameraAllowedMemberIds,
  addCameraAllowedMemberId,
  removeCameraAllowedMemberId,
  setParticipantConnectionState,
  removeParticipantConnectionState,
  clearParticipantPresenceState,
} from "@/libs/features/room/roomSlice";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { useLazyGetIceServersQuery } from "@/libs/features/webrtc/webrtcApiSlice";
import toast from "react-hot-toast";
import type { DebateSide } from "@/types/room";

export interface RoomUser {
  id: string;
  name: string;
  side?: DebateSide;
}

export interface UseRoomSocketOptions {
  roomId: string | undefined;
  currentUserId: string | undefined;
  isPrivileged?: boolean;
  onUserJoined?: (data: { user: RoomUser; socketId: string }) => void;
  onUserLeft?: (data: { memberId: string; socketId: string }) => void;
  onLocalLeave?: (memberId: string) => void;
  onLocalDisconnect?: () => void;
  onLocalReconnect?: () => void;
  onKicked?: () => void;
}

export interface UseRoomSocketReturn {
  joinRoom: (side?: DebateSide) => Promise<void>;
  leaveRoom: () => Promise<void>;
  hasJoined: boolean;
  localVideoStream: MediaStream | null;
  remoteVideoStreams: Record<string, MediaStream>;
  screenShareStreams: Record<string, MediaStream>;
  selectedScreenShareOwnerId: string | null;
  selectedCameraOwnerId: string | null;
  isVideoEnabled: boolean;
  startVideo: () => Promise<void>;
  stopVideo: (emitActivity?: boolean) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  selectScreenShare: (userId: string) => void;
  selectCamera: (userId: string) => void;
  closeMediaView: () => void;
  isScreenSharing: boolean;
}

// Only ONE media view (a camera OR a screen share) can be open per viewer.
type ActiveMedia = { kind: "camera" | "screen"; ownerId: string } | null;

export function useRoomSocket({
  roomId,
  currentUserId,
  isPrivileged = false,
  onUserJoined,
  onUserLeft,
  onLocalLeave,
  onLocalDisconnect,
  onLocalReconnect,
  onKicked,
}: UseRoomSocketOptions): UseRoomSocketReturn {
  const { startAudio, stopAudio, localStreamRef, streamVersion } = useAudio();
  const dispatch = useAppDispatch();
  const cameraEnabled = useAppSelector((state) => state.room.cameraEnabled);
  const cameraDisabledMemberIds = useAppSelector(
    (state) => state.room.cameraDisabledMemberIds,
  );
  const cameraAllowedMemberIds = useAppSelector(
    (state) => state.room.cameraAllowedMemberIds,
  );

  const hasJoinedRef = useRef(false);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const socketToUserRef = useRef<Map<string, string>>(new Map());
  const joiningRef = useRef(false);
  const selectedDebateSideRef = useRef<DebateSide | undefined>(undefined);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const screenShareOwnerRef = useRef<string | null>(null);
  const stoppingScreenShareRef = useRef(false);
  const activeScreenShareUsersRef = useRef<Set<string>>(new Set());
  const screenShareStreamIdsRef = useRef<Map<string, string>>(new Map());
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({});
  const [screenShareStreams, setScreenShareStreams] = useState<Record<string, MediaStream>>({});
  const [activeMedia, setActiveMedia] = useState<ActiveMedia>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Mirrors so event callbacks can read the latest streams without re-subscribing.
  const remoteVideoStreamsRef = useRef<Record<string, MediaStream>>({});
  const screenShareStreamsRef = useRef<Record<string, MediaStream>>({});
  useEffect(() => {
    remoteVideoStreamsRef.current = remoteVideoStreams;
  }, [remoteVideoStreams]);
  useEffect(() => {
    screenShareStreamsRef.current = screenShareStreams;
  }, [screenShareStreams]);

  const selectedScreenShareOwnerId =
    activeMedia?.kind === "screen" ? activeMedia.ownerId : null;
  const selectedCameraOwnerId =
    activeMedia?.kind === "camera" ? activeMedia.ownerId : null;

  // ── Active media helpers ────────────────────────────────────────────────────
  const clearActiveMedia = useCallback(
    (kind: "camera" | "screen", ownerId: string) => {
      setActiveMedia((previous) =>
        previous && previous.kind === kind && previous.ownerId === ownerId
          ? null
          : previous,
      );
    },
    [],
  );

  const removeRemoteCamera = useCallback(
    (userId: string) => {
      setRemoteVideoStreams((previous) => {
        if (!(userId in previous)) return previous;
        const next = { ...previous };
        delete next[userId];
        return next;
      });
      clearActiveMedia("camera", userId);
    },
    [clearActiveMedia],
  );

  const removeRemoteScreenShare = useCallback(
    (userId: string) => {
      activeScreenShareUsersRef.current.delete(userId);
      screenShareStreamIdsRef.current.delete(userId);
      setScreenShareStreams((previous) => {
        if (!(userId in previous)) return previous;
        const next = { ...previous };
        delete next[userId];
        return next;
      });
      clearActiveMedia("screen", userId);
    },
    [clearActiveMedia],
  );

  const registerRemoteScreenShare = useCallback(
    (userId: string, stream: MediaStream) => {
      // If this stream was first classified as a camera (track arrived before
      // the screen-share-state event), move it out of the camera list.
      if (remoteVideoStreamsRef.current[userId]?.id === stream.id) {
        removeRemoteCamera(userId);
      }

      setScreenShareStreams((previous) =>
        previous[userId] === stream ? previous : { ...previous, [userId]: stream },
      );

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (screenShareStreamsRef.current[userId] === stream) {
            removeRemoteScreenShare(userId);
          }
        };
      });
    },
    [removeRemoteCamera, removeRemoteScreenShare],
  );

  const clearPeerState = useCallback(() => {
    socketToUserRef.current.clear();
    activeScreenShareUsersRef.current.clear();
    screenShareStreamIdsRef.current.clear();
    setRemoteVideoStreams({});
    setScreenShareStreams({});
    setActiveMedia(null);
  }, []);

  const removeRemoteParticipant = useCallback(
    (userId: string) => {
      const socketIds = [...socketToUserRef.current.entries()]
        .filter(([, mappedUserId]) => mappedUserId === userId)
        .map(([socketId]) => socketId);

      for (const socketId of socketIds) {
        socketToUserRef.current.delete(socketId);
        peerManagerRef.current?.closeConnection(socketId);
      }

      removeRemoteCamera(userId);
      removeRemoteScreenShare(userId);
      setActiveMedia((previous) =>
        previous?.ownerId === userId ? null : previous,
      );

      dispatch(removeVolumeLevel(userId));
      dispatch(removeUnMutedUser(userId));
      dispatch(removeSpeakingUser(userId));
      dispatch(removeParticipantConnectionState(userId));
    },
    [dispatch, removeRemoteCamera, removeRemoteScreenShare],
  );

  const getLocalMediaStream = useCallback(() => {
    const tracks = [
      ...(localStreamRef.current?.getTracks() ?? []),
      ...(videoStreamRef.current?.getTracks() ?? []),
    ];
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  }, [localStreamRef]);

  const syncLocalMedia = useCallback(() => {
    if (!peerManagerRef.current) return;

    void peerManagerRef.current.renegotiateAll(
      getLocalMediaStream(),
      screenShareStreamRef.current,
    );
  }, [getLocalMediaStream]);

  // NOTE: accepts `unknown` because this function is also used as a click
  // handler; a click event must never end up in a socket payload.
  const stopVideo = useCallback(
    (emitActivityArg: unknown = true) => {
      const emitActivity =
        typeof emitActivityArg === "boolean" ? emitActivityArg : true;
      const wasVideoEnabled = videoStreamRef.current !== null;
      videoStreamRef.current?.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
      setLocalVideoStream(null);
      setIsVideoEnabled(false);
      if (currentUserId) clearActiveMedia("camera", currentUserId);
      if (roomId) {
        roomSocketManager.emit("camera-state", {
          roomId,
          cameraEnabled: false,
          activity: emitActivity && wasVideoEnabled,
        });
      }
      void peerManagerRef.current?.removeTracksByKind("video");
    },
    [roomId, currentUserId, clearActiveMedia],
  );

  const stopScreenShare = useCallback(
    (activityArg?: unknown) => {
      // Same protection as above: only a real boolean is ever sent.
      const activity = typeof activityArg === "boolean" ? activityArg : true;

      if (stoppingScreenShareRef.current) return;
      stoppingScreenShareRef.current = true;

      try {
        const ownerId = screenShareOwnerRef.current ?? currentUserId;
        const stream = screenShareStreamRef.current;

        // Clear refs first so re-entrant calls (track.onended) are harmless.
        screenShareStreamRef.current = null;
        screenShareOwnerRef.current = null;

        stream?.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });

        setIsScreenSharing(false);
        if (ownerId) {
          setScreenShareStreams((previous) => {
            if (!(ownerId in previous)) return previous;
            const next = { ...previous };
            delete next[ownerId];
            return next;
          });
          activeScreenShareUsersRef.current.delete(ownerId);
          screenShareStreamIdsRef.current.delete(ownerId);
          clearActiveMedia("screen", ownerId);
        }

        if (stream && ownerId && roomId && currentUserId === ownerId) {
          roomSocketManager.emit("screen-share-state", {
            roomId,
            sharing: false,
            activity,
          });
        }

        void peerManagerRef.current?.removeScreenShareTracks();
      } finally {
        stoppingScreenShareRef.current = false;
      }
    },
    [currentUserId, roomId, clearActiveMedia],
  );

  const startScreenShare = useCallback(async () => {
    if (!roomId || !currentUserId || screenShareStreamRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // A second start could have won the race while the picker was open.
      if (screenShareStreamRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      stream.getVideoTracks().forEach((track) => {
        track.contentHint = "detail";
        track.onended = () => {
          stopScreenShare();
        };
      });

      screenShareStreamRef.current = stream;
      screenShareOwnerRef.current = currentUserId;
      screenShareStreamIdsRef.current.set(currentUserId, stream.id);
      setScreenShareStreams((previous) => ({
        ...previous,
        [currentUserId]: stream,
      }));
      activeScreenShareUsersRef.current.add(currentUserId);
      setIsScreenSharing(true);
      roomSocketManager.emit("screen-share-state", {
        roomId,
        sharing: true,
        streamId: stream.id,
      });
      await peerManagerRef.current?.addScreenShareStream(stream);
    } catch (error) {
      console.error("[useRoomSocket] Failed to start screen share:", error);
      toast.error(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Screen share permission was denied."
          : "Unable to start screen sharing.",
      );
    }
  }, [currentUserId, roomId, stopScreenShare]);

  // Selecting any media replaces the previous one -> only one view at a time.
  const selectScreenShare = useCallback((userId: string) => {
    setActiveMedia({ kind: "screen", ownerId: userId });
  }, []);

  const selectCamera = useCallback((userId: string) => {
    setActiveMedia({ kind: "camera", ownerId: userId });
  }, []);

  const closeMediaView = useCallback(() => {
    setActiveMedia(null);
  }, []);

  // If the viewed stream disappears for any reason, close the view.
  useEffect(() => {
    if (!activeMedia) return;
    const stream =
      activeMedia.kind === "screen"
        ? screenShareStreams[activeMedia.ownerId]
        : activeMedia.ownerId === currentUserId
          ? localVideoStream
          : remoteVideoStreams[activeMedia.ownerId];
    if (!stream) setActiveMedia(null);
  }, [
    activeMedia,
    screenShareStreams,
    remoteVideoStreams,
    localVideoStream,
    currentUserId,
  ]);

  const startVideo = useCallback(async () => {
    if (
      !roomId ||
      !currentUserId ||
      (!cameraEnabled &&
        !isPrivileged &&
        !cameraAllowedMemberIds.includes(currentUserId)) ||
      cameraDisabledMemberIds.includes(currentUserId) ||
      videoStreamRef.current
    ) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStreamRef.current = stream;
      setLocalVideoStream(stream);
      setIsVideoEnabled(true);
      roomSocketManager.emit("camera-state", { roomId, cameraEnabled: true });
      syncLocalMedia();
    } catch (error) {
      console.error("[useRoomSocket] Failed to start camera:", error);
      toast.error(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera permission was denied."
          : "Unable to start your camera.",
      );
    }
  }, [
    cameraDisabledMemberIds,
    cameraAllowedMemberIds,
    cameraEnabled,
    currentUserId,
    isPrivileged,
    roomId,
    syncLocalMedia,
  ]);

  const [getIceServers] = useLazyGetIceServersQuery();

  // ── Join ────────────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (side?: DebateSide) => {
    if (!roomId || !currentUserId) {
      throw new Error("Missing room or user information");
    }

    if (hasJoinedRef.current || joiningRef.current) {
      return;
    }

    joiningRef.current = true;
    if (side) selectedDebateSideRef.current = side;

    try {
      const response = await getIceServers().unwrap();

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid ICE server response");
      }

      const peerConfiguration: RTCConfiguration = {
        iceServers: response.data,
      };

      peerManagerRef.current = new PeerManager(roomId, peerConfiguration);
      peerManagerRef.current.on("track", (socketId, event) => {
        if (!event) return;

        const stream = event.streams[0];
        const userId = socketToUserRef.current.get(socketId);
        if (!stream || !userId) return;

        if (
          event.track.kind === "video" &&
          (event.track.contentHint === "detail" ||
            screenShareStreamIdsRef.current.get(userId) === stream.id)
        ) {
          registerRemoteScreenShare(userId, stream);
          return;
        }

        if (event.track.kind !== "video") return;

        setRemoteVideoStreams((previous) => ({ ...previous, [userId]: stream }));
        event.track.onended = () => {
          if (remoteVideoStreamsRef.current[userId] === stream) {
            removeRemoteCamera(userId);
          }
        };
      });

      peerManagerRef.current.on("volume", (socketId, _event, volume = 0) => {
        const userId = socketToUserRef.current.get(socketId);

        if (!userId) return;

        dispatch(
          setVolumeLevel({
            userId,
            volume,
          }),
        );
      });

      await startAudio(currentUserId, roomId);

      await roomSocketManager.emitWithAck<{
        success: boolean;
        message?: string;
        code?: string;
      }>("join-room", {
        roomId,
        ...(selectedDebateSideRef.current
          ? { side: selectedDebateSideRef.current }
          : {}),
      });

      hasJoinedRef.current = true;
      dispatch(
        setParticipantConnectionState({
          userId: currentUserId,
          state: "connected",
        }),
      );

      console.log(`[useRoomSocket] Successfully joined room ${roomId}`);
    } catch (error) {
      const isMemberKicked =
        error instanceof Error &&
        "code" in error &&
        error.code === "MEMBER_KICKED";
      if (!isMemberKicked) {
        console.error("[useRoomSocket] Failed to join room:", error);
      }

      peerManagerRef.current?.closeAll();
      peerManagerRef.current = null;

      stopAudio(currentUserId);
      stopVideo(false);

      hasJoinedRef.current = false;

      throw error;
    } finally {
      joiningRef.current = false;
    }
  }, [
    roomId,
    currentUserId,
    getIceServers,
    startAudio,
    stopAudio,
    stopVideo,
    dispatch,
    registerRemoteScreenShare,
    removeRemoteCamera,
  ]);

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const initialState = roomSocketManager.getConnectionState();
    let wasReconnecting = initialState === "reconnecting";
    let hasConnected =
      initialState === "connected" || wasReconnecting;

    if (wasReconnecting && hasJoinedRef.current) {
      onLocalDisconnect?.();
      dispatch(
        setParticipantConnectionState({
          userId: currentUserId,
          state: "connection-lost",
        }),
      );
    }

    const unsubscribe = roomSocketManager.onStateChange((state) => {
      if (state === "reconnecting") {
        wasReconnecting = true;
        if (hasJoinedRef.current) {
          onLocalDisconnect?.();
          dispatch(
            setParticipantConnectionState({
              userId: currentUserId,
              state: "connection-lost",
            }),
          );
        }
        return;
      }

      if (state !== "connected") return;
      if (!hasConnected) {
        hasConnected = true;
        return;
      }
      if (!wasReconnecting) return;

      wasReconnecting = false;
      if (!hasJoinedRef.current || joiningRef.current) return;

      joiningRef.current = true;
      void roomSocketManager
        .emitWithAck<{
          success: boolean;
          message?: string;
          code?: string;
        }>("join-room", {
          roomId,
          reconnectOnly: true,
          ...(selectedDebateSideRef.current
            ? { side: selectedDebateSideRef.current }
            : {}),
        })
        .then(() => {
          onLocalReconnect?.();
          dispatch(
            setParticipantConnectionState({
              userId: currentUserId,
              state: "connected",
            }),
          );

          const screenShareStream = screenShareStreamRef.current;
          if (screenShareStream) {
            roomSocketManager.emit("screen-share-state", {
              roomId,
              sharing: true,
              streamId: screenShareStream.id,
              activity: false,
            });
          }
        })
        .catch((error: unknown) => {
          const reconnectWindowExpired =
            error instanceof Error &&
            "code" in error &&
            error.code === "RECONNECT_WINDOW_EXPIRED";
          const memberWasKicked =
            error instanceof Error &&
            "code" in error &&
            error.code === "MEMBER_KICKED";
          if (reconnectWindowExpired || memberWasKicked) {
            hasJoinedRef.current = false;
            stopAudio(currentUserId);
            stopVideo(false);
            stopScreenShare(false);
            peerManagerRef.current?.closeAll();
            peerManagerRef.current = null;
            clearPeerState();
            dispatch(clearParticipantPresenceState());
            onLocalLeave?.(currentUserId);
            if (memberWasKicked) {
              dispatch(addKickedMemberId(currentUserId));
              onKicked?.();
            } else {
              toast.error(
                "Your room reconnection period expired. Join the room again to continue.",
              );
            }
            return;
          }

          console.error("[useRoomSocket] Failed to restore room membership:", error);
          dispatch(
            setParticipantConnectionState({
              userId: currentUserId,
              state: "disconnected",
            }),
          );
          toast.error("Unable to restore your room connection.");
        })
        .finally(() => {
          joiningRef.current = false;
        });
    });

    return unsubscribe;
  }, [
    currentUserId,
    dispatch,
    onLocalDisconnect,
    onLocalLeave,
    onLocalReconnect,
    onKicked,
    roomId,
    stopAudio,
    stopVideo,
    stopScreenShare,
    clearPeerState,
  ]);

  useEffect(() => {
    if (!roomId) return;

    return roomSocketManager.on("room-member-kicked", (payload: unknown) => {
      const data = payload as { roomId: string; memberId: string };
      if (data.roomId !== roomId || data.memberId !== currentUserId) return;

      stopAudio(currentUserId);
      stopVideo(false);
      stopScreenShare(false);
      peerManagerRef.current?.closeAll();
      peerManagerRef.current = null;
      clearPeerState();
      hasJoinedRef.current = false;
      dispatch(clearParticipantPresenceState());
      dispatch(addKickedMemberId(data.memberId));
      onKicked?.();
    });
  }, [
    roomId,
    currentUserId,
    onKicked,
    stopAudio,
    stopVideo,
    stopScreenShare,
    clearPeerState,
    dispatch,
  ]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(async () => {
    if (!roomId || !currentUserId) return;

    const leaveConfirmation = roomSocketManager.emitWithAck("leave-room", {
      roomId,
    });
    onLocalLeave?.(currentUserId);
    stopAudio(currentUserId);
    stopVideo(false);
    stopScreenShare(false);
    peerManagerRef.current?.closeAll();
    peerManagerRef.current = null;
    clearPeerState();
    hasJoinedRef.current = false;
    dispatch(clearParticipantPresenceState());

    try {
      await leaveConfirmation;
      console.log(`[useRoomSocket] Left room ${roomId}`);
    } catch (error) {
      console.error("[useRoomSocket] Failed to leave room:", error);
      toast.error("Unable to confirm that you left the room.");
      throw error;
    }
  }, [
    roomId,
    currentUserId,
    stopAudio,
    stopVideo,
    stopScreenShare,
    clearPeerState,
    dispatch,
    onLocalLeave,
  ]);

  // ── user-joined / user-left ─────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return;

    const unsubParticipants = roomSocketManager.on(
      "room-participants",
      (payload: unknown) => {
        const { roomId: eventRoomId, participants } = payload as {
          roomId: string;
          participants: {
            user: RoomUser;
            socketId: string;
          }[];
        };

        if (eventRoomId !== roomId) return;

        for (const participant of participants ?? []) {
          socketToUserRef.current.set(
            participant.socketId,
            participant.user.id,
          );
          dispatch(
            setParticipantConnectionState({
              userId: participant.user.id,
              state: "connected",
            }),
          );
          onUserJoined?.({
            user: participant.user,
            socketId: participant.socketId,
          });

          console.log(
            `[useRoomSocket] Existing participant mapped: ${participant.user.name} (${participant.socketId})`,
          );
        }
      },
    );

    const unsubJoined = roomSocketManager.on(
      "user-joined",
      async (payload: unknown) => {
        const { roomId: eventRoomId, user, socketId } = payload as {
          roomId: string;
          user: RoomUser;
          socketId: string;
        };

        if (eventRoomId !== roomId || user.id === currentUserId) return;

        for (const [previousSocketId, previousUserId] of socketToUserRef.current) {
          if (previousUserId === user.id && previousSocketId !== socketId) {
            peerManagerRef.current?.closeConnection(previousSocketId);
            socketToUserRef.current.delete(previousSocketId);
          }
        }

        socketToUserRef.current.set(socketId, user.id);
        dispatch(
          setParticipantConnectionState({
            userId: user.id,
            state: "connected",
          }),
        );

        console.log(`[useRoomSocket] user-joined: ${user.name} (${socketId})`);

        onUserJoined?.({
          user,
          socketId,
        });

        if (!peerManagerRef.current) return;

        const mySocketId = roomSocketManager.getSocket()?.id;

        if (socketId === mySocketId) return;

        peerManagerRef.current.createConnection(
          socketId,
          getLocalMediaStream(),
          screenShareStreamRef.current,
        );

        await peerManagerRef.current.createOffer(socketId);
      },
    );

    const unsubConnectionState = roomSocketManager.on(
      "participant-connection-state",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          userId: string;
          state:
            | "connected"
            | "connection-lost"
            | "reconnecting"
            | "disconnected";
        };
        if (event.roomId !== roomId) return;
        dispatch(
          setParticipantConnectionState({
            userId: event.userId,
            state: event.state,
          }),
        );
      },
    );

    const unsubLeft = roomSocketManager.on("user-left", (payload: unknown) => {
      const { roomId: eventRoomId, memberId, socketId } = payload as {
        roomId: string;
        memberId: string;
        socketId: string;
      };

      if (eventRoomId !== roomId) return;

      if (socketId && !socketToUserRef.current.has(socketId)) {
        peerManagerRef.current?.closeConnection(socketId);
      }
      removeRemoteParticipant(memberId);

      console.log(`[useRoomSocket] user-left: ${memberId}`);

      onUserLeft?.({
        memberId,
        socketId,
      });
    });

    const unsubMemberRemoved = roomSocketManager.on(
      "room-member-removed",
      (payload: unknown) => {
        const event = payload as { roomId: string; memberId: string };
        if (event.roomId !== roomId) return;

        removeRemoteParticipant(event.memberId);
        if (event.memberId !== currentUserId || !hasJoinedRef.current) return;

        stopAudio(currentUserId);
        stopVideo(false);
        stopScreenShare(false);
        peerManagerRef.current?.closeAll();
        peerManagerRef.current = null;
        clearPeerState();
        hasJoinedRef.current = false;
        dispatch(clearParticipantPresenceState());
        onLocalLeave?.(currentUserId);
      },
    );

    return () => {
      unsubParticipants();
      unsubJoined();
      unsubConnectionState();
      unsubLeft();
      unsubMemberRemoved();
    };
  }, [
    roomId,
    currentUserId,
    onUserJoined,
    onUserLeft,
    removeRemoteParticipant,
    dispatch,
    getLocalMediaStream,
    clearPeerState,
    stopAudio,
    stopVideo,
    stopScreenShare,
    onLocalLeave,
  ]);

  // ── WebRTC signaling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const unsubOffer = roomSocketManager.on("offer", async (payload: unknown) => {
      const { from, offer } = payload as {
        from: string;
        offer: RTCSessionDescriptionInit;
      };
      console.log(`[useRoomSocket] Received offer from ${from}`);
      await peerManagerRef.current?.handleOffer(
        from,
        offer,
        getLocalMediaStream(),
        screenShareStreamRef.current,
      );
    });

    const unsubAnswer = roomSocketManager.on("answer", async (payload: unknown) => {
      const { from, answer } = payload as {
        from: string;
        answer: RTCSessionDescriptionInit;
      };
      console.log(`[useRoomSocket] Received answer from ${from}`);
      await peerManagerRef.current?.handleAnswer(from, answer);
    });

    const unsubIce = roomSocketManager.on(
      "ice-candidate",
      async (payload: unknown) => {
        const { from, candidate } = payload as {
          from: string;
          candidate: RTCIceCandidateInit;
        };
        await peerManagerRef.current?.handleIceCandidate(from, candidate);
      },
    );

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubIce();
    };
  }, [roomId, getLocalMediaStream]);

  // streamVersion is real React state, so this effect correctly fires when
  // the user unmutes for the first time and localStreamRef.current is set.
  useEffect(() => {
    if (!hasJoinedRef.current) return;
    if (!localStreamRef.current) return;
    if (!peerManagerRef.current) return;
    if (peerManagerRef.current.getPeerCount() === 0) return;

    console.log(
      `[useRoomSocket] Stream available (v${streamVersion}), renegotiating with ${peerManagerRef.current.getPeerCount()} peers`,
    );
    syncLocalMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamVersion, syncLocalMedia]);

  // ── Cleanup if unmounted without joining ────────────────────────────────────
  useEffect(() => {
    return () => {
      stopScreenShare(false);
      stopVideo(false);
      if (!hasJoinedRef.current) {
        if (currentUserId) {
          stopAudio(currentUserId);
        }
        peerManagerRef.current?.closeAll();
        peerManagerRef.current = null;
      }
    };
  }, [currentUserId, stopAudio, stopScreenShare, stopVideo]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = roomSocketManager.on(
      "room-force-muted-state",
      (payload: unknown) => {
        const {
          roomId: eventRoomId,
          forceMutedUsers,
          muteAll,
          muteAllExcludedUsers,
          moderatorIds,
          kickedMemberIds,
          cameraEnabled,
          cameraDisabledMemberIds,
          cameraAllowedMemberIds,
        } = payload as {
          roomId: string;
          forceMutedUsers: string[];
          muteAll: boolean;
          muteAllExcludedUsers: string[];
          moderatorIds: string[];
          kickedMemberIds: string[];
          cameraEnabled: boolean;
          cameraDisabledMemberIds: string[];
          cameraAllowedMemberIds: string[];
        };

        if (eventRoomId !== roomId) {
          return;
        }

        dispatch(setForceMutedUsers(forceMutedUsers ?? []));
        dispatch(setMuteAll(muteAll ?? false));
        dispatch(setMuteAllExcludedUsers(muteAllExcludedUsers ?? []));
        dispatch(setModeratorIds(moderatorIds ?? []));
        dispatch(setKickedMemberIds(kickedMemberIds ?? []));
        dispatch(setCameraEnabled(cameraEnabled ?? true));
        dispatch(setCameraDisabledMemberIds(cameraDisabledMemberIds ?? []));
        dispatch(setCameraAllowedMemberIds(cameraAllowedMemberIds ?? []));
      },
    );

    return unsubscribe;
  }, [roomId, dispatch]);

  useEffect(() => {
    if (
      cameraEnabled ||
      isPrivileged ||
      cameraAllowedMemberIds.includes(currentUserId ?? "")
    ) return;
    stopVideo(false);
  }, [
    cameraAllowedMemberIds,
    cameraEnabled,
    currentUserId,
    isPrivileged,
    stopVideo,
  ]);

  // ── Screen share state (start/stop broadcast from server) ──────────────────
  useEffect(() => {
    if (!roomId) return;
    return roomSocketManager.on("screen-share-state", (payload: unknown) => {
      const event = payload as {
        roomId: string;
        userId: string;
        sharing: boolean;
        streamId?: string;
      };

      if (event.roomId !== roomId) return;

      if (event.sharing) {
        activeScreenShareUsersRef.current.add(event.userId);
        if (event.streamId) {
          screenShareStreamIdsRef.current.set(event.userId, event.streamId);
        }

        if (event.userId === currentUserId) {
          setScreenShareStreams((previous) => ({
            ...previous,
            [event.userId]:
              screenShareStreamRef.current ?? previous[event.userId],
          }));
          setIsScreenSharing(Boolean(screenShareStreamRef.current));
          return;
        }

        // The track may have arrived BEFORE this event and been classified as
        // a camera. Reclassify it as a screen share now that the id is known.
        const existing = remoteVideoStreamsRef.current[event.userId];
        if (event.streamId && existing && existing.id === event.streamId) {
          registerRemoteScreenShare(event.userId, existing);
        }
        return;
      }

      // sharing === false
      if (event.userId === currentUserId) {
        // Ignore a stale echo of an old stop if a newer share is already active.
        if (screenShareStreamRef.current) return;
        setIsScreenSharing(false);
      }
      removeRemoteScreenShare(event.userId);
    });
  }, [
    currentUserId,
    roomId,
    registerRemoteScreenShare,
    removeRemoteScreenShare,
  ]);

  useEffect(() => {
    if (!roomId) return;
    return roomSocketManager.on("room-camera-state", (payload: unknown) => {
      const event = payload as { roomId: string; cameraEnabled: boolean };
      if (event.roomId !== roomId) return;
      dispatch(setCameraEnabled(event.cameraEnabled));
      if (event.cameraEnabled) {
        dispatch(setCameraDisabledMemberIds([]));
        dispatch(setCameraAllowedMemberIds([]));
      }
    });
  }, [roomId, dispatch]);

  useEffect(() => {
    if (!roomId) return;
    return roomSocketManager.on("room-camera-force-stop", (payload: unknown) => {
      const event = payload as { roomId: string };
      if (event.roomId !== roomId || isPrivileged) return;
      stopVideo(false);
    });
  }, [isPrivileged, roomId, stopVideo]);

  useEffect(() => {
    if (!roomId) return;
    return roomSocketManager.on("room-member-camera-state", (payload: unknown) => {
      const event = payload as {
        roomId: string;
        memberId: string;
        cameraEnabled: boolean;
      };
      if (event.roomId !== roomId) return;
      dispatch(
        event.cameraEnabled
          ? removeCameraDisabledMemberId(event.memberId)
          : addCameraDisabledMemberId(event.memberId),
      );
      dispatch(
        event.cameraEnabled
          ? addCameraAllowedMemberId(event.memberId)
          : removeCameraAllowedMemberId(event.memberId),
      );
      if (!event.cameraEnabled && event.memberId === currentUserId) {
        stopVideo(false);
      }
      if (!event.cameraEnabled) {
        removeRemoteCamera(event.memberId);
      }
    });
  }, [currentUserId, dispatch, roomId, stopVideo, removeRemoteCamera]);

  useEffect(() => {
    if (!roomId) return;
    return roomSocketManager.on("camera-state", (payload: unknown) => {
      const event = payload as {
        roomId: string;
        userId: string;
        cameraEnabled: boolean;
      };
      if (event.roomId !== roomId || event.cameraEnabled) return;
      removeRemoteCamera(event.userId);
    });
  }, [roomId, removeRemoteCamera]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = roomSocketManager.on(
      "member-force-mute-status",
      (payload: unknown) => {
        const { userId, forceMuted } = payload as {
          userId: string;
          forceMuted: boolean;
        };

        if (forceMuted) {
          dispatch(setForceMutedUser(userId));
        } else {
          dispatch(removeForceMutedUser(userId));
        }
      },
    );

    return unsubscribe;
  }, [roomId, dispatch]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = roomSocketManager.on(
      "room-mute-all-state",
      (payload: unknown) => {
        const {
          roomId: eventRoomId,
          muteAll,
          muteAllExcludedUsers,
        } = payload as {
          roomId: string;
          muteAll: boolean;
          muteAllExcludedUsers: string[];
        };

        if (eventRoomId !== roomId) {
          return;
        }

        dispatch(setMuteAll(muteAll));

        dispatch(setMuteAllExcludedUsers(muteAllExcludedUsers ?? []));

        if (muteAll) {
          dispatch(clearUnMutedUsersExcept(muteAllExcludedUsers ?? []));
        }
      },
    );

    return unsubscribe;
  }, [roomId, dispatch]);

  return {
    joinRoom,
    leaveRoom,
    hasJoined: hasJoinedRef.current,
    localVideoStream,
    remoteVideoStreams,
    screenShareStreams,
    selectedScreenShareOwnerId,
    selectedCameraOwnerId,
    isVideoEnabled,
    startVideo,
    stopVideo,
    startScreenShare,
    stopScreenShare,
    selectScreenShare,
    selectCamera,
    closeMediaView,
    isScreenSharing,
  };
}