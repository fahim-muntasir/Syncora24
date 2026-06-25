// src/hooks/useAudioStream.ts
import { useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import {
  setAudioEnabled,
  setMuted,
  setSpeakingUser,
  removeSpeakingUser,
} from "@/libs/features/room/roomSlice";
import toast from "react-hot-toast";

export function useAudioStream(userId?: string) {
  const localStreamRef = useRef<MediaStream | null>(null);
  const dispatch = useAppDispatch();
  const isMuted = useAppSelector((s) => s.room.isMuted);

  // 🎤 Start microphone
  const startAudio = async () => {
    try {
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        dispatch(setAudioEnabled(true));
        toast.success("Microphone enabled");

        // 🔊 Detect speaking
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 512;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detectSpeaking = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          if (volume > 20) {
            dispatch(setSpeakingUser(userId || ""));
          } else {
            dispatch(removeSpeakingUser(userId || ""));
          }

          requestAnimationFrame(detectSpeaking);
        };

        detectSpeaking();
      }
      return localStreamRef.current;
    } catch (err) {
      console.error("Mic error:", err);
      toast.error("Failed to access microphone");
      throw err;
    }
  };

  // 🛑 Stop microphone
  const stopAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      dispatch(setAudioEnabled(false));
      dispatch(removeSpeakingUser(userId || ""));
    }
  };

  // 🔇 Toggle mute/unmute
  const toggleMute = () => {
    console.log("Toggling mute", localStreamRef.current);
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        dispatch(setMuted(!track.enabled));

        toast.success(track.enabled ? "Unmuted" : "Muted");
      }
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => stopAudio();
  }, []);

  return {
    localStreamRef,
    isMuted,
    startAudio,
    stopAudio,
    toggleMute,
  };
}
