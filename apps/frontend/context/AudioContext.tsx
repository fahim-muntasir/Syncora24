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
  setSpeakingUser,
  removeSpeakingUser,
  clearForceMutedUsers,
  clearUnMutedUsers,
  setUnMutedUser,
  removeUnMutedUser,
  setForceMutedUser,
  removeForceMutedUser,
  setVolumeLevel,
} from "@/libs/features/room/roomSlice";
import toast from "react-hot-toast";
import { socketManager } from "@/libs/socket/index";

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

const SPEAKING_CONFIG = {
  VOICE_BAND_START: 2,
  VOICE_BAND_END: 30,
  SPEAKING_THRESHOLD: 12,
  SPEAKING_STOP_DELAY: 800,
  FFT_SIZE: 512,
  SMOOTHING: 0.85,
  MIN_DECIBELS: -100,
  MAX_DECIBELS: -30,
};

const localVolumeMonitorRef = {
  analyser: null as AnalyserNode | null,
  frame: null as number | null,
  audioContext: null as AudioContext | null,
  source: null as MediaStreamAudioSourceNode | null,
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);

  const nativeAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasSpeakingRef = useRef(false);
  const currentRoomIdRef = useRef("");
  const currentUserIdRef = useRef("");

  const dispatch = useAppDispatch();
  const isMuted = useAppSelector((s) => s.room.isMuted);
  const muteAllExcludedUsers = useAppSelector((s) => s.room.muteAllExcludedUsers);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const currentUserId = useAppSelector((state) => state.auth.user?.id ?? "");

  const muteAll = useAppSelector((state) => state.room.muteAll);
  const forceMutedUsers = useAppSelector((state) => state.room.forceMutedUsers);

  const isForceMuted =
    forceMutedUsers.includes(currentUserId) ||
    (muteAll && !muteAllExcludedUsers.includes(currentUserId));

  const getAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (
      !nativeAudioCtxRef.current ||
      nativeAudioCtxRef.current.state === "closed"
    ) {
      nativeAudioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (nativeAudioCtxRef.current.state === "suspended") {
      await nativeAudioCtxRef.current.resume();
    }

    return nativeAudioCtxRef.current;
  }, []);

  const stopDetectionLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stopTimeoutRef.current !== null) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startLocalVolumeMonitoring = useCallback(
    async (stream: MediaStream, userId: string) => {
      // Stop existing monitoring
      if (localVolumeMonitorRef.frame !== null) {
        cancelAnimationFrame(localVolumeMonitorRef.frame);
        localVolumeMonitorRef.frame = null;
      }
      if (
        localVolumeMonitorRef.source &&
        localVolumeMonitorRef.analyser
      ) {
        try {
          localVolumeMonitorRef.source.disconnect();
        } catch (e) {
          
        }
      }
      if (localVolumeMonitorRef.audioContext?.state !== "closed") {
        try {
          localVolumeMonitorRef.audioContext?.close();
        } catch (e) {
          
        }
      }

      try {
        const ctx = await getAudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        localVolumeMonitorRef.analyser = analyser;
        localVolumeMonitorRef.audioContext = ctx;
        localVolumeMonitorRef.source = source;

        const data = new Uint8Array(analyser.fftSize);
        let lastUpdate = 0;

        const updateVolume = (timestamp: number) => {
          if (!localVolumeMonitorRef.analyser) return;

          try {
            localVolumeMonitorRef.analyser.getByteTimeDomainData(data);

            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const normalized = (data[i] - 128) / 128;
              sum += normalized * normalized;
            }

            const rms = Math.sqrt(sum / data.length);
            let volume = Math.min(1, rms * 4);

            if (volume < 0.01) {
              volume = 0;
            }

            if (timestamp - lastUpdate >= 50) {
              dispatch(setVolumeLevel({ userId, volume }));
              lastUpdate = timestamp;
            }
          } catch (err) {
            console.error("[AudioContext] Local volume error:", err);
          }

          const frame = requestAnimationFrame(updateVolume);
          localVolumeMonitorRef.frame = frame;
        };

        requestAnimationFrame(updateVolume);
        console.log("[AudioContext] Local volume monitoring started");
      } catch (err) {
        console.error("[AudioContext] Local volume monitoring failed:", err);
      }
    },
    [dispatch, getAudioContext]
  );

  const stopLocalVolumeMonitoring = useCallback(() => {
    if (localVolumeMonitorRef.frame !== null) {
      cancelAnimationFrame(localVolumeMonitorRef.frame);
      localVolumeMonitorRef.frame = null;
    }
    if (localVolumeMonitorRef.source) {
      try {
        localVolumeMonitorRef.source.disconnect();
      } catch (e) {
        
      }
      localVolumeMonitorRef.source = null;
    }
    if (localVolumeMonitorRef.analyser) {
      try {
        localVolumeMonitorRef.analyser.disconnect();
      } catch (e) {
        
      }
      localVolumeMonitorRef.analyser = null;
    }
    if (localVolumeMonitorRef.audioContext?.state !== "closed") {
      try {
        localVolumeMonitorRef.audioContext?.close();
      } catch (e) {
        
      }
      localVolumeMonitorRef.audioContext = null;
    }
  }, []);

  const initializeAudioDetection = useCallback(
    async (stream: MediaStream, userId: string, roomId: string) => {
      stopDetectionLoop();

      try {
        const ctx = await getAudioContext();
        const analyser = ctx.createAnalyser();

        analyser.fftSize = SPEAKING_CONFIG.FFT_SIZE;
        analyser.smoothingTimeConstant = SPEAKING_CONFIG.SMOOTHING;
        analyser.minDecibels = SPEAKING_CONFIG.MIN_DECIBELS;
        analyser.maxDecibels = SPEAKING_CONFIG.MAX_DECIBELS;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detect = () => {
          const track = localStreamRef.current?.getAudioTracks()[0];
          const enabled = track?.enabled ?? false;

          if (enabled) {
            analyser.getByteFrequencyData(dataArray);

            const voiceBins = dataArray.slice(
              SPEAKING_CONFIG.VOICE_BAND_START,
              SPEAKING_CONFIG.VOICE_BAND_END,
            );

            const energy = voiceBins.reduce((a, b) => a + b, 0) / voiceBins.length;
            const speaking = energy > SPEAKING_CONFIG.SPEAKING_THRESHOLD;

            if (speaking && !wasSpeakingRef.current) {
              if (stopTimeoutRef.current) {
                clearTimeout(stopTimeoutRef.current);
                stopTimeoutRef.current = null;
              }
              wasSpeakingRef.current = true;
              dispatch(setSpeakingUser(userId));
              socketManager.emit("user-speaking", {
                roomId,
                userId,
                speaking: true,
              });
            } else if (
              !speaking &&
              wasSpeakingRef.current &&
              !stopTimeoutRef.current
            ) {
              stopTimeoutRef.current = setTimeout(() => {
                wasSpeakingRef.current = false;
                stopTimeoutRef.current = null;
                dispatch(removeSpeakingUser(userId));

                socketManager.emit("user-speaking", { roomId, userId, speaking: false});
              }, SPEAKING_CONFIG.SPEAKING_STOP_DELAY);
            }
          } else if (wasSpeakingRef.current) {
            wasSpeakingRef.current = false;
            if (stopTimeoutRef.current) {
              clearTimeout(stopTimeoutRef.current);
              stopTimeoutRef.current = null;
            }
            dispatch(removeSpeakingUser(userId));
            socketManager.emit("user-speaking", {
              roomId,
              userId,
              speaking: false,
            });
          }

          animationFrameRef.current = requestAnimationFrame(detect);
        };

        detect();
      } catch (err) {
        console.error("[AudioContext] Failed to initialize audio detection:", err);
      }
    },
    [dispatch, getAudioContext, stopDetectionLoop],
  );

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
      toast.success("Joined room — mic muted by default");
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

      wasSpeakingRef.current = false;
      currentRoomIdRef.current = "";
      currentUserIdRef.current = "";

      setIsAudioEnabled(false);
      dispatch(setAudioEnabled(false));
      dispatch(removeSpeakingUser(userId));
    },
    [dispatch, stopDetectionLoop, stopLocalVolumeMonitoring],
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
            socketManager.emit("user-mute-status", {
              roomId,
              userId,
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
            socketManager.emit("user-mute-status", {
              roomId,
              userId,
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
          socketManager.emit("user-mute-status", {
            roomId,
            userId,
            isUnMuted: false,
          });
          dispatch(removeSpeakingUser(userId));
          socketManager.emit("user-speaking", {
            roomId,
            userId,
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
    const unsub = socketManager.on("user-mute-status", (payload: unknown) => {
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
    const unsubscribe = socketManager.on(
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

        socketManager.emit("user-speaking", {
          roomId,
          userId,
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
    const unsubscribe = socketManager.on(
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
    socketManager.emit("moderator-mute-user", {
      roomId,
      targetUserId,
    });
  };

  const forceUnmuteUser = (roomId: string, targetUserId: string) => {
    socketManager.emit("moderator-unmute-user", {
      roomId,
      targetUserId,
    });
  };

  useEffect(() => {
    const unsubscribe = socketManager.on(
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