import { useEffect, useRef, useCallback, useState } from "react";
import { socketManager } from "@/libs/socket/index";
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
  setCameraEnabled,
  setCameraDisabledMemberIds,
  addCameraDisabledMemberId,
  removeCameraDisabledMemberId,
  setCameraAllowedMemberIds,
  addCameraAllowedMemberId,
  removeCameraAllowedMemberId,
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
  currentUserName?: string;
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
  isVideoEnabled: boolean;
  startVideo: () => Promise<void>;
  stopVideo: () => void;
}

export function useRoomSocket({
  roomId,
  currentUserId,
  currentUserName,
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
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const getLocalMediaStream = useCallback(() => {
    const tracks = [
      ...(localStreamRef.current?.getTracks() ?? []),
      ...(videoStreamRef.current?.getTracks() ?? []),
    ];
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  }, [localStreamRef]);

  const stopVideo = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;
    setLocalVideoStream(null);
    setIsVideoEnabled(false);
    if (roomId) {
      socketManager.emit("camera-state", { roomId, cameraEnabled: false });
    }
    void peerManagerRef.current?.removeTracksByKind("video");
  }, [roomId]);

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
      socketManager.emit("camera-state", { roomId, cameraEnabled: true });
      await peerManagerRef.current?.renegotiateAll(stream);
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
        if (!event || event.track.kind !== "video") return;
        const stream = event.streams[0];
        const userId = socketToUserRef.current.get(socketId);
        if (!stream || !userId) return;

        setRemoteVideoStreams((previous) => ({ ...previous, [userId]: stream }));
        event.track.onended = () => {
          setRemoteVideoStreams((previous) => {
            const next = { ...previous };
            delete next[userId];
            return next;
          });
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

      await socketManager.emitWithAck<{
        success: boolean;
        message?: string;
        code?: string;
      }>("join-room", {
        roomId,
        user: {
          id: currentUserId,
          name: currentUserName,
        },
      });

      hasJoinedRef.current = true;

      console.log(`[useRoomSocket] Successfully joined room ${roomId}`);
    } catch (error) {
      console.error("[useRoomSocket] Failed to join room:", error);

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
    currentUserName,
    getIceServers,
    startAudio,
    stopAudio,
    stopVideo,
    dispatch,
  ]);

  useEffect(() => {
    if (!roomId) return;

    return socketManager.on("room-member-kicked", (payload: unknown) => {
      const data = payload as { roomId: string; memberId: string };
      if (data.roomId !== roomId || data.memberId !== currentUserId) return;

      stopAudio(currentUserId);
      stopVideo();
      peerManagerRef.current?.closeAll();
      peerManagerRef.current = null;
      hasJoinedRef.current = false;
      dispatch(addKickedMemberId(data.memberId));
      onKicked?.();
    });
  }, [roomId, currentUserId, onKicked, stopAudio, stopVideo, dispatch]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    if (!roomId || !currentUserId) return;

    socketManager.emit("leave-room", { roomId, memberId: currentUserId });
    stopAudio(currentUserId);
    stopVideo();
    peerManagerRef.current?.closeAll();
    peerManagerRef.current = null;
    hasJoinedRef.current = false;

    console.log(`[useRoomSocket] Left room ${roomId}`);
  }, [roomId, currentUserId, stopAudio, stopVideo]);

  // ── user-joined / user-left ─────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return;

    const unsubParticipants = socketManager.on(
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

          console.log(
            `[useRoomSocket] Existing participant mapped: ${participant.user.name} (${participant.socketId})`,
          );
        }
      },
    );

    const unsubJoined = socketManager.on(
      "user-joined",
      async (payload: unknown) => {
        const { user, socketId } = payload as {
          user: RoomUser;
          socketId: string;
        };

        socketToUserRef.current.set(socketId, user.id);

        console.log(`[useRoomSocket] user-joined: ${user.name} (${socketId})`);

        onUserJoined?.({
          user,
          socketId,
        });

        if (!peerManagerRef.current) return;

        const mySocketId = socketManager.getSocket()?.id;

        if (socketId === mySocketId) return;

        const pc = peerManagerRef.current.createConnection(
          socketId,
          getLocalMediaStream(),
        );

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);

        socketManager.emit("offer", {
          to: socketId,
          offer,
        });
      },
    );

    const unsubLeft = socketManager.on("user-left", (payload: unknown) => {
      const { memberId, socketId } = payload as {
        memberId: string;
        socketId: string;
      };

      const userId = socketToUserRef.current.get(socketId);
      socketToUserRef.current.delete(socketId);
      if (userId) {
        setRemoteVideoStreams((previous) => {
          const next = { ...previous };
          delete next[userId];
          return next;
        });
      }

      dispatch(removeVolumeLevel(memberId));

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
      unsubLeft();
    };
  }, [roomId, onUserJoined, onUserLeft, dispatch, streamVersion, getLocalMediaStream]);

  // ── WebRTC signaling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const unsubOffer = socketManager.on("offer", async (payload: unknown) => {
      const { from, offer } = payload as {
        from: string;
        offer: RTCSessionDescriptionInit;
      };
      console.log(`[useRoomSocket] Received offer from ${from}`);
      await peerManagerRef.current?.handleOffer(
        from,
        offer,
        getLocalMediaStream(),
      );
    });

    const unsubAnswer = socketManager.on("answer", async (payload: unknown) => {
      const { from, answer } = payload as {
        from: string;
        answer: RTCSessionDescriptionInit;
      };
      console.log(`[useRoomSocket] Received answer from ${from}`);
      await peerManagerRef.current?.handleAnswer(from, answer);
    });

    const unsubIce = socketManager.on(
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
  }, [roomId, streamVersion, getLocalMediaStream]);

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
    peerManagerRef.current.renegotiateAll(localStreamRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamVersion]);

  // ── Cleanup if unmounted without joining ────────────────────────────────────
  useEffect(() => {
    return () => {
      stopVideo();
      if (!hasJoinedRef.current) {
        if (currentUserId) {
          stopAudio(currentUserId);
        }
        peerManagerRef.current?.closeAll();
        peerManagerRef.current = null;
      }
    };
  }, [currentUserId, stopAudio, stopVideo]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = socketManager.on(
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
    return socketManager.on("room-camera-state", (payload: unknown) => {
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
    return socketManager.on("room-camera-force-stop", (payload: unknown) => {
      const event = payload as { roomId: string };
      if (event.roomId !== roomId || isPrivileged) return;
      stopVideo();
    });
  }, [isPrivileged, roomId, stopVideo]);

  useEffect(() => {
    if (!roomId) return;
    return socketManager.on("room-member-camera-state", (payload: unknown) => {
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
    return socketManager.on("camera-state", (payload: unknown) => {
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
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = socketManager.on(
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

    const unsubscribe = socketManager.on(
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
    isVideoEnabled,
    startVideo,
    stopVideo,
  };
}
