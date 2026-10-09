"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import {
  setAudioEnabled,
  setMuted,
  removeSpeakingUser,
  clearForceMutedUsers,
  clearUnMutedUsers,
  setUnMutedUser,
  removeUnMutedUser,
  setForceMutedUser,
  removeForceMutedUser,
} from "@/libs/features/room/roomSlice";
import toast from "react-hot-toast";
import { roomSocketManager } from "@/libs/socket/index";
import { useLocalAudioMonitoring } from "@/hooks/useLocalAudioMonitoring";

type AudioContextType = {
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  streamVersion: number;
  isMuted: boolean;
  isAudioEnabled: boolean;
  startAudio: (userId: string, roomId: string) => Promise<MediaStream | null>;
  stopAudio: (userId: string) => void;
  toggleMute: (roomId: string, userId: string) => void;
  forceMuteUser: (roomId: string, targetUserId: string) => void;
  forceUnmuteUser: (roomId: string, targetUserId: string) => void;
};

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);

  const nativeAudioCtxRef = useRef<AudioContext | null>(null);
  const currentRoomIdRef = useRef("");
  const currentUserIdRef = useRef("");

  const dispatch = useAppDispatch();
  const {
    getAudioContext,
    stopDetectionLoop,
    startLocalVolumeMonitoring,
    stopLocalVolumeMonitoring,
    initializeAudioDetection,
    resetSpeakingState,
  } = useLocalAudioMonitoring({
    dispatch,
    localStreamRef,
    nativeAudioCtxRef,
  });
  const isMuted = useAppSelector((s) => s.room.isMuted);
  const muteAllExcludedUsers = useAppSelector((s) => s.room.muteAllExcludedUsers);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const currentUserId = useAppSelector((state) => state.auth.user?.id ?? "");

  const muteAll = useAppSelector((state) => state.room.muteAll);
  const forceMutedUsers = useAppSelector((state) => state.room.forceMutedUsers);

  const isForceMuted =
    forceMutedUsers.includes(currentUserId) ||
    (muteAll && !muteAllExcludedUsers.includes(currentUserId));

  const requestMicrophoneAccess = useCallback(
    async (): Promise<MediaStream | null> => {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 48000 },
            sampleSize: { ideal: 16 },
          },
          video: false,
        });

        const track = stream.getAudioTracks()[0];
        if (track) {
          track.enabled = true;

          const settings = track.getSettings();
          console.log("[AudioContext] Audio track settings:", {
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
          });
        }

        localStreamRef.current = stream;
        setStreamVersion((v) => v + 1);

        await initializeAudioDetection(
          stream,
          currentUserIdRef.current,
          currentRoomIdRef.current,
        );

        await startLocalVolumeMonitoring(stream, currentUserIdRef.current);

        return stream;
      } catch (err) {
        if (err instanceof DOMException) {
          const messages: Record<string, string> = {
            NotFoundError:
              "No microphone found. Please connect a microphone.",
            NotAllowedError:
              "Microphone access denied. Please allow it in browser settings.",
            NotReadableError:
              "Microphone is already in use by another application.",
          };
          toast.error(messages[err.name] ?? "Failed to access microphone.");
        } else {
          toast.error("Failed to access microphone.");
        }
        throw err;
      }
    },
    [initializeAudioDetection, startLocalVolumeMonitoring],
  );

  const startAudio = useCallback(
    async (userId: string, roomId: string): Promise<MediaStream | null> => {
      currentRoomIdRef.current = roomId;
      currentUserIdRef.current = userId;
      setIsAudioEnabled(true);
      dispatch(setAudioEnabled(true));
      dispatch(setMuted(true));
      // toast.success("Joined room — mic muted by default");
      return null;
    },
    [dispatch],
  );

  const stopAudio = useCallback(
    (userId: string) => {
      stopLocalVolumeMonitoring();

      stopDetectionLoop();

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setStreamVersion((v) => v + 1);

      if (nativeAudioCtxRef.current?.state !== "closed") {
        nativeAudioCtxRef.current?.close();
      }
      nativeAudioCtxRef.current = null;

      resetSpeakingState();
      currentRoomIdRef.current = "";
      currentUserIdRef.current = "";

      setIsAudioEnabled(false);
      dispatch(setAudioEnabled(false));
      dispatch(removeSpeakingUser(userId));
    },
    [
      dispatch,
      resetSpeakingState,
      stopDetectionLoop,
      stopLocalVolumeMonitoring,
    ],
  );

  const toggleMute = useCallback(
    async (roomId: string, userId: string) => {
      if (isForceMuted) {
        toast.error("You have been muted by a moderator.");
        return;
      }

      if (isMuted) {
        if (!localStreamRef.current) {
          try {
            const stream = await requestMicrophoneAccess();
            if (!stream) return;
            dispatch(setMuted(false));
            roomSocketManager.emit("user-mute-status", {
              roomId,
              isUnMuted: true,
            });
            toast.success("Microphone on");
            dispatch(setUnMutedUser(userId));
          } catch {
            dispatch(setMuted(true));
          }
        } else {
          const track = localStreamRef.current.getAudioTracks()[0];
          if (track) {
            track.enabled = true;
            dispatch(setMuted(false));
            roomSocketManager.emit("user-mute-status", {
              roomId,
              isUnMuted: true,
            });
            await getAudioContext();
            toast.success("Microphone on");
            dispatch(setUnMutedUser(userId));
          }
        }
      } else {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
          track.enabled = false;
          dispatch(setMuted(true));
          roomSocketManager.emit("user-mute-status", {
            roomId,
            isUnMuted: false,
          });
          dispatch(removeSpeakingUser(userId));
          roomSocketManager.emit("user-speaking", {
            roomId,
            speaking: false,
          });
          toast.success("Microphone muted");
          dispatch(removeUnMutedUser(userId));
        }
      }
    },
    [
      isForceMuted,
      isMuted,
      dispatch,
      requestMicrophoneAccess,
      getAudioContext,
    ],
  );

  useEffect(() => {
    const unsub = roomSocketManager.on("user-mute-status", (payload: unknown) => {
      const { userId, isUnMuted: muted } = payload as {
        userId: string;
        isUnMuted: boolean;
      };

      if (muted) {
        dispatch(setUnMutedUser(userId));
      } else {
        dispatch(removeUnMutedUser(userId));
      }
    });

    return () => {
      unsub();
      stopDetectionLoop();
      if (nativeAudioCtxRef.current?.state !== "closed") {
        nativeAudioCtxRef.current?.close();
      }
    };
  }, [dispatch, stopDetectionLoop]);

  useEffect(() => {
    if (!currentUserId || !isForceMuted) return;

    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = false;
    }

    dispatch(setMuted(true));
    dispatch(removeUnMutedUser(currentUserId));
    dispatch(removeSpeakingUser(currentUserId));
  }, [muteAll, forceMutedUsers, currentUserId, dispatch]);

  useEffect(() => {
    const unsubscribe = roomSocketManager.on(
      "member-force-muted",
      (payload: unknown) => {
        const { roomId, userId, forceMuted } = payload as {
          roomId: string;
          userId: string;
          forceMuted: boolean;
        };

        if (roomId !== currentRoomIdRef.current) return;
        if (userId !== currentUserIdRef.current) return;
        if (!forceMuted) return;

        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
          track.enabled = false;
        }

        dispatch(setForceMutedUser(userId));
        dispatch(setMuted(true));
        dispatch(removeUnMutedUser(userId));
        dispatch(removeSpeakingUser(userId));

        roomSocketManager.emit("user-speaking", {
          roomId,
          speaking: false,
        });

        toast.error("You have been muted by a moderator.");
      },
    );

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    const unsubscribe = roomSocketManager.on(
      "member-force-unmuted",
      (payload: unknown) => {
        const { roomId, userId } = payload as {
          roomId: string;
          userId: string;
        };

        if (roomId !== currentRoomIdRef.current) return;
        if (userId !== currentUserIdRef.current) return;

        dispatch(removeForceMutedUser(userId));
        toast.success("You can now unmute your microphone.");
      },
    );

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const forceMuteUser = (roomId: string, targetUserId: string) => {
    roomSocketManager.emit("moderator-mute-user", {
      roomId,
      targetUserId,
    });
  };

  const forceUnmuteUser = (roomId: string, targetUserId: string) => {
    roomSocketManager.emit("moderator-unmute-user", {
      roomId,
      targetUserId,
    });
  };

  useEffect(() => {
    const unsubscribe = roomSocketManager.on(
      "room-ended-for-members",
      (payload: unknown) => {
        const { roomId: eventRoomId } = payload as {
          roomId: string;
        };

        if (eventRoomId !== currentRoomIdRef.current) return;

        stopLocalVolumeMonitoring();
        stopDetectionLoop();
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
          setStreamVersion((v) => v + 1);
        }

        dispatch(setAudioEnabled(false));
        dispatch(setMuted(true));
        dispatch(clearUnMutedUsers());
        dispatch(clearForceMutedUsers());
      },
    );

    return unsubscribe;
  }, [dispatch, stopDetectionLoop, stopLocalVolumeMonitoring]);

  return (
    <AudioCtx.Provider
      value={{
        localStreamRef,
        streamVersion,
        isMuted,
        isAudioEnabled,
        startAudio,
        stopAudio,
        toggleMute,
        forceMuteUser,
        forceUnmuteUser,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
};