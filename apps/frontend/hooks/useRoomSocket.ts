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
  setCameraEnabled,
  setCameraDisabledMemberIds,
  addCameraDisabledMemberId,
  removeCameraDisabledMemberId,
  setCameraAllowedMemberIds,
  addCameraAllowedMemberId,
  removeCameraAllowedMemberId,
  setParticipantConnectionState,
  removeParticipantConnectionState,
} from "@/libs/features/room/roomSlice";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { useLazyGetIceServersQuery } from "@/libs/features/webrtc/webrtcApiSlice";
import toast from "react-hot-toast";

export interface RoomUser {
  id: string;
  name: string;
}

export interface UseRoomSocketOptions {
  roomId: string | undefined;
  currentUserId: string | undefined;
  isPrivileged?: boolean;
  onUserJoined?: (data: { user: RoomUser; socketId: string }) => void;
  onUserLeft?: (data: { memberId: string; socketId: string }) => void;
  onKicked?: () => void;
}

export interface UseRoomSocketReturn {
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  hasJoined: boolean;
  localVideoStream: MediaStream | null;
  remoteVideoStreams: Record<string, MediaStream>;
  screenShareStreams: Record<string, MediaStream>;
  selectedScreenShareOwnerId: string | null;
  selectedCameraOwnerId: string | null;
  isVideoEnabled: boolean;
  startVideo: () => Promise<void>;
  stopVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  selectScreenShare: (userId: string) => void;
  selectCamera: (userId: string) => void;
  isScreenSharing: boolean;
}

export function useRoomSocket({
  roomId,
  currentUserId,
  isPrivileged = false,
  onUserJoined,
  onUserLeft,
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
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const screenShareOwnerRef = useRef<string | null>(null);
  const stoppingScreenShareRef = useRef(false);
  const activeScreenShareUsersRef = useRef<Set<string>>(new Set());
  const screenShareStreamIdsRef = useRef<Map<string, string>>(new Map());
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({});
  const [screenShareStreams, setScreenShareStreams] = useState<Record<string, MediaStream>>({});
  const [selectedScreenShareOwnerId, setSelectedScreenShareOwnerId] = useState<string | null>(null);
  const [selectedCameraOwnerId, setSelectedCameraOwnerId] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
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

  const stopVideo = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;
    setLocalVideoStream(null);
    setIsVideoEnabled(false);
    setSelectedCameraOwnerId((selected) =>
      selected === currentUserId ? null : selected,
    );
    if (roomId) {
      roomSocketManager.emit("camera-state", { roomId, cameraEnabled: false });
    }
    void peerManagerRef.current?.removeTracksByKind("video");
  }, [roomId]);

  const stopScreenShare = useCallback(() => {
    if (stoppingScreenShareRef.current) return;
    stoppingScreenShareRef.current = true;

    const ownerId = screenShareOwnerRef.current ?? currentUserId;
    screenShareStreamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    screenShareStreamRef.current = null;
    screenShareOwnerRef.current = null;
    setIsScreenSharing(false);
    setScreenShareStreams((previous) => {
      const next = { ...previous };
      if (ownerId) delete next[ownerId];
      return next;
    });
    if (ownerId && roomId && currentUserId === ownerId) {
      roomSocketManager.emit("screen-share-state", {
        roomId,
        sharing: false,
      });
    }
    activeScreenShareUsersRef.current.delete(ownerId ?? "");
    if (ownerId) {
      screenShareStreamIdsRef.current.delete(ownerId);
    }
    setSelectedScreenShareOwnerId((selected) =>
      selected === ownerId ? null : selected,
    );
    void peerManagerRef.current?.removeScreenShareTracks();
    stoppingScreenShareRef.current = false;
  }, [currentUserId, roomId]);

  const startScreenShare = useCallback(async () => {
    if (!roomId || !currentUserId || screenShareStreamRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

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
      setSelectedScreenShareOwnerId(currentUserId);
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

  const selectScreenShare = useCallback((userId: string) => {
    setSelectedScreenShareOwnerId(userId);
  }, []);

  const selectCamera = useCallback((userId: string) => {
    setSelectedCameraOwnerId(userId);
  }, []);

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
  const joinRoom = useCallback(async () => {
    if (!roomId || !currentUserId) {
      throw new Error("Missing room or user information");
    }

    if (hasJoinedRef.current || joiningRef.current) {
      return;
    }

    joiningRef.current = true;

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
          setScreenShareStreams((previous) => ({
            ...previous,
            [userId]: stream,
          }));
          event.track.onended = () => {
            setScreenShareStreams((previous) => {
              if (previous[userId] !== stream) return previous;
              const next = { ...previous };
              delete next[userId];
              return next;
            });
            activeScreenShareUsersRef.current.delete(userId);
            screenShareStreamIdsRef.current.delete(userId);
            setSelectedScreenShareOwnerId((selected) =>
              selected === userId ? null : selected,
            );
          };
          return;
        }

        if (event.track.kind !== "video") return;

        setRemoteVideoStreams((previous) => ({ ...previous, [userId]: stream }));
        event.track.onended = () => {
          setRemoteVideoStreams((previous) => {
            const next = { ...previous };
            delete next[userId];
            return next;
          });
          setSelectedCameraOwnerId((selected) =>
            selected === userId ? null : selected,
          );
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
      }>("join-room", { roomId });

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
      stopVideo();

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
  ]);

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const initialState = roomSocketManager.getConnectionState();
    let wasReconnecting = initialState === "reconnecting";
    let hasConnected =
      initialState === "connected" || wasReconnecting;

    const unsubscribe = roomSocketManager.onStateChange((state) => {
      if (state === "reconnecting") {
        wasReconnecting = true;
        if (hasJoinedRef.current) {
          dispatch(
            setParticipantConnectionState({
              userId: currentUserId,
              state: "reconnecting",
            }),
          );
        }
        return;
      }

      if (state === "disconnected") {
        if (hasJoinedRef.current) {
          dispatch(
            setParticipantConnectionState({
              userId: currentUserId,
              state: "disconnected",
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
        }>("join-room", { roomId })
        .then(() => {
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
            });
          }
        })
        .catch((error: unknown) => {
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
  }, [currentUserId, dispatch, roomId]);

  useEffect(() => {
    if (!roomId) return;

    return roomSocketManager.on("room-member-kicked", (payload: unknown) => {
      const data = payload as { roomId: string; memberId: string };
      if (data.roomId !== roomId || data.memberId !== currentUserId) return;

      stopAudio(currentUserId);
      stopVideo();
      peerManagerRef.current?.closeAll();
      peerManagerRef.current = null;
      hasJoinedRef.current = false;
      dispatch(removeParticipantConnectionState(currentUserId ?? ""));
      dispatch(addKickedMemberId(data.memberId));
      onKicked?.();
    });
  }, [roomId, currentUserId, onKicked, stopAudio, stopVideo, dispatch]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    if (!roomId || !currentUserId) return;

    roomSocketManager.emit("leave-room", { roomId });
    stopAudio(currentUserId);
    stopVideo();
    peerManagerRef.current?.closeAll();
    peerManagerRef.current = null;
    hasJoinedRef.current = false;
    dispatch(removeParticipantConnectionState(currentUserId));

    console.log(`[useRoomSocket] Left room ${roomId}`);
  }, [roomId, currentUserId, stopAudio, stopVideo, dispatch]);

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
          state: "connected" | "reconnecting" | "disconnected";
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

      const userId = socketToUserRef.current.get(socketId);
      socketToUserRef.current.delete(socketId);
      if (userId) {
        setRemoteVideoStreams((previous) => {
          const next = { ...previous };
          delete next[userId];
          return next;
        });
        activeScreenShareUsersRef.current.delete(userId);
        screenShareStreamIdsRef.current.delete(userId);
        setScreenShareStreams((previous) => {
          const next = { ...previous };
          delete next[userId];
          return next;
        });
        setSelectedScreenShareOwnerId((selected) =>
          selected === userId ? null : selected,
        );
        setSelectedCameraOwnerId((selected) =>
          selected === userId ? null : selected,
        );
      }

      dispatch(removeVolumeLevel(memberId));
      dispatch(removeUnMutedUser(memberId));
      dispatch(removeParticipantConnectionState(memberId));

      console.log(`[useRoomSocket] user-left: ${memberId}`);

      onUserLeft?.({
        memberId,
        socketId,
      });

      peerManagerRef.current?.closeConnection(socketId);
    });

    return () => {
      unsubParticipants();
      unsubJoined();
      unsubConnectionState();
      unsubLeft();
    };
  }, [
    roomId,
    currentUserId,
    onUserJoined,
    onUserLeft,
    dispatch,
    getLocalMediaStream,
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
      stopScreenShare();
      stopVideo();
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
    stopVideo();
  }, [
    cameraAllowedMemberIds,
    cameraEnabled,
    currentUserId,
    isPrivileged,
    stopVideo,
  ]);

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
        }
        return;
      }

      activeScreenShareUsersRef.current.delete(event.userId);
      screenShareStreamIdsRef.current.delete(event.userId);
      if (event.userId === currentUserId) {
        setIsScreenSharing(false);
      }
      setScreenShareStreams((previous) => {
        const next = { ...previous };
        delete next[event.userId];
        return next;
      });
      setSelectedScreenShareOwnerId((selected) =>
        selected === event.userId ? null : selected,
      );
    });
  }, [currentUserId, roomId]);

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
      stopVideo();
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
        stopVideo();
      }
      if (!event.cameraEnabled) {
        setRemoteVideoStreams((previous) => {
          const next = { ...previous };
          delete next[event.memberId];
          return next;
        });
      }
    });
  }, [currentUserId, dispatch, roomId, stopVideo]);

  useEffect(() => {
    if (!roomId) return;
    return roomSocketManager.on("camera-state", (payload: unknown) => {
      const event = payload as {
        roomId: string;
        userId: string;
        cameraEnabled: boolean;
      };
      if (event.roomId !== roomId || event.cameraEnabled) return;
      setRemoteVideoStreams((previous) => {
        const next = { ...previous };
        delete next[event.userId];
        return next;
      });
    });
  }, [currentUserId, roomId]);

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
    isScreenSharing,
  };
}
