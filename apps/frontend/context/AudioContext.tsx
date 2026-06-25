// context/AudioContext.tsx
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
} from "@/libs/features/room/roomSlice";
import toast from "react-hot-toast";
import { socketManager } from "@/libs/socket/index";

type AudioContextType = {
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  /** Increments every time localStreamRef.current changes — use this in effects */
  streamVersion: number;
  isMuted: boolean;
  isAudioEnabled: boolean;
  startAudio: (userId: string, roomId: string) => Promise<MediaStream | null>;
  stopAudio: (userId: string) => void;
  toggleMute: (roomId: string, userId: string) => void;
};

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const localStreamRef = useRef<MediaStream | null>(null);
  // ↑ This is the key fix: a numeric version that increments whenever
  //   localStreamRef.current changes, so useEffect deps can react to it.
  const [streamVersion, setStreamVersion] = useState(0);

  const nativeAudioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasSpeakingRef = useRef(false);
  const currentRoomIdRef = useRef("");
  const currentUserIdRef = useRef("");

  const dispatch = useAppDispatch();
  const isMuted = useAppSelector((s) => s.room.isMuted);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // ── helpers ─────────────────────────────────────────────────────────────────

  /** Safely get-or-create a running AudioContext */
  const getAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (!nativeAudioCtxRef.current || nativeAudioCtxRef.current.state === "closed") {
      nativeAudioCtxRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
    }
    // Browsers suspend AudioContext until a user gesture — resume it
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
  }, []);

  // ── Speaking detection ──────────────────────────────────────────────────────
  const initializeAudioDetection = useCallback(
    async (stream: MediaStream, userId: string, roomId: string) => {
      stopDetectionLoop(); // cancel any existing loop first

      try {
        const ctx = await getAudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -10;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detect = () => {
          const track = localStreamRef.current?.getAudioTracks()[0];
          const enabled = track?.enabled ?? false;

          if (enabled) {
            analyser.getByteFrequencyData(dataArray);
            // Focus on voice frequencies (85–255 Hz band roughly maps to lower bins)
            const voiceBins = dataArray.slice(2, 30);
            const volume = voiceBins.reduce((a, b) => a + b, 0) / voiceBins.length;
            const speaking = volume > 20;

            if (speaking && !wasSpeakingRef.current) {
              if (stopTimeoutRef.current) {
                clearTimeout(stopTimeoutRef.current);
                stopTimeoutRef.current = null;
              }
              wasSpeakingRef.current = true;
              dispatch(setSpeakingUser(userId));
              socketManager.emit("user-speaking", { roomId, userId, speaking: true });
            } else if (!speaking && wasSpeakingRef.current && !stopTimeoutRef.current) {
              stopTimeoutRef.current = setTimeout(() => {
                wasSpeakingRef.current = false;
                stopTimeoutRef.current = null;
                dispatch(removeSpeakingUser(userId));
                socketManager.emit("user-speaking", { roomId, userId, speaking: false });
              }, 600);
            }
          } else if (wasSpeakingRef.current) {
            // Muted — immediately stop speaking indicator
            wasSpeakingRef.current = false;
            if (stopTimeoutRef.current) {
              clearTimeout(stopTimeoutRef.current);
              stopTimeoutRef.current = null;
            }
            dispatch(removeSpeakingUser(userId));
            socketManager.emit("user-speaking", { roomId, userId, speaking: false });
          }

          animationFrameRef.current = requestAnimationFrame(detect);
        };

        detect();
      } catch (err) {
        console.error("[AudioContext] Failed to initialize audio detection:", err);
      }
    },
    [dispatch, getAudioContext, stopDetectionLoop]
  );

  // ── Microphone access ───────────────────────────────────────────────────────
  const requestMicrophoneAccess = useCallback(async (): Promise<MediaStream | null> => {
    try {
      // Stop any existing stream tracks before requesting new ones
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // latency: 0,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false,
      });

      const track = stream.getAudioTracks()[0];
      if (track) track.enabled = true;

      localStreamRef.current = stream;
      // Signal React that the stream changed
      setStreamVersion((v) => v + 1);

      await initializeAudioDetection(
        stream,
        currentUserIdRef.current,
        currentRoomIdRef.current
      );

      return stream;
    } catch (err) {
      if (err instanceof DOMException) {
        const messages: Record<string, string> = {
          NotFoundError: "No microphone found. Please connect a microphone.",
          NotAllowedError: "Microphone access denied. Please allow it in browser settings.",
          NotReadableError: "Microphone is already in use by another application.",
        };
        toast.error(messages[err.name] ?? "Failed to access microphone.");
      } else {
        toast.error("Failed to access microphone.");
      }
      throw err;
    }
  }, [initializeAudioDetection]);

  // ── Public API ──────────────────────────────────────────────────────────────

  const startAudio = useCallback(async (
    userId: string,
    roomId: string
  ): Promise<MediaStream | null> => {
    currentRoomIdRef.current = roomId;
    currentUserIdRef.current = userId;
    setIsAudioEnabled(true);
    dispatch(setAudioEnabled(true));
    dispatch(setMuted(true));
    toast.success("Joined room — mic muted by default");
    return null;
  }, [dispatch]);

  const stopAudio = useCallback((userId: string) => {
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
  }, [dispatch, stopDetectionLoop]);

  const toggleMute = useCallback(async (roomId: string, userId: string) => {
    if (isMuted) {
      // ── Unmuting ────────────────────────────────────────────────────────────
      if (!localStreamRef.current) {
        // First unmute — request microphone
        try {
          const stream = await requestMicrophoneAccess();
          if (!stream) return;
          dispatch(setMuted(false));
          socketManager.emit("user-mute-status", { roomId, userId, isUnMuted: true });
          toast.success("Microphone on");
        } catch {
          dispatch(setMuted(true));
        }
      } else {
        // Stream exists, just re-enable track
        const track = localStreamRef.current.getAudioTracks()[0];
        if (track) {
          track.enabled = true;
          dispatch(setMuted(false));
          socketManager.emit("user-mute-status", { roomId, userId, isUnMuted: true });
          // Resume AudioContext if needed (browser may have suspended it)
          await getAudioContext();
          toast.success("Microphone on");
        }
      }
    } else {
      // ── Muting ──────────────────────────────────────────────────────────────
      const track = localStreamRef.current?.getAudioTracks()[0];
      if (track) {
        track.enabled = false;
        dispatch(setMuted(true));
        socketManager.emit("user-mute-status", { roomId, userId, isUnMuted: false });
        dispatch(removeSpeakingUser(userId));
        socketManager.emit("user-speaking", { roomId, userId, speaking: false });
        toast.success("Microphone muted");
      }
    }
  }, [isMuted, dispatch, requestMicrophoneAccess, getAudioContext]);

  // ── Listen for other users' mute status ────────────────────────────────────
  useEffect(() => {
    const unsub = socketManager.on("user-mute-status", (payload: unknown) => {
      const { userId, isMuted: muted } = payload as {
        userId: string;
        isMuted: boolean;
      };
      console.log(`[Audio] ${userId} is now ${muted ? "muted" : "unmuted"}`);
      // You can dispatch to Redux here if you track other users' mute state
    });

    return () => {
      unsub();
      stopDetectionLoop();
      if (nativeAudioCtxRef.current?.state !== "closed") {
        nativeAudioCtxRef.current?.close();
      }
    };
  }, [stopDetectionLoop]);

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