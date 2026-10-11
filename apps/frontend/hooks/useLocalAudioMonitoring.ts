import { useCallback, useRef, type MutableRefObject } from "react";
import {
  removeSpeakingUser,
  setSpeakingUser,
  setVolumeLevel,
} from "@/libs/features/room/roomSlice";
import type { AppDispatch } from "@/libs/store";
import { roomSocketManager } from "@/libs/socket/index";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const SPEAKING_CONFIG = {
  SPEAKING_START_THRESHOLD: 0.018,
  SPEAKING_STOP_THRESHOLD: 0.012,
  SPEAKING_STOP_DELAY: 450,
  FFT_SIZE: 512,
};

const localVolumeMonitorRef = {
  analyser: null as AnalyserNode | null,
  frame: null as number | null,
  source: null as MediaStreamAudioSourceNode | null,
};

interface UseLocalAudioMonitoringOptions {
  dispatch: AppDispatch;
  localStreamRef: MutableRefObject<MediaStream | null>;
  nativeAudioCtxRef: MutableRefObject<AudioContext | null>;
}

export function useLocalAudioMonitoring({
  dispatch,
  localStreamRef,
  nativeAudioCtxRef,
}: UseLocalAudioMonitoringOptions) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionStateUnsubscribeRef = useRef<(() => void) | null>(null);
  const wasSpeakingRef = useRef(false);

  const getAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (
      !nativeAudioCtxRef.current ||
      nativeAudioCtxRef.current.state === "closed"
    ) {
      const AudioContextConstructor =
        window.AudioContext || window.webkitAudioContext!;
      nativeAudioCtxRef.current = new AudioContextConstructor();
    }

    if (nativeAudioCtxRef.current.state === "suspended") {
      await nativeAudioCtxRef.current.resume();
    }

    return nativeAudioCtxRef.current;
  }, [nativeAudioCtxRef]);

  const stopDetectionLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stopTimeoutRef.current !== null) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    connectionStateUnsubscribeRef.current?.();
    connectionStateUnsubscribeRef.current = null;
    analyserRef.current = null;
  }, []);

  const resetSpeakingState = useCallback(() => {
    wasSpeakingRef.current = false;
  }, []);

  const startLocalVolumeMonitoring = useCallback(
    async (stream: MediaStream, userId: string) => {
      if (localVolumeMonitorRef.frame !== null) {
        cancelAnimationFrame(localVolumeMonitorRef.frame);
        localVolumeMonitorRef.frame = null;
      }
      if (localVolumeMonitorRef.source) {
        try {
          localVolumeMonitorRef.source.disconnect();
        } catch {
          
        }
      }
      if (localVolumeMonitorRef.analyser) {
        localVolumeMonitorRef.analyser.disconnect();
      }

      try {
        const ctx = await getAudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        localVolumeMonitorRef.analyser = analyser;
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
      } catch {
        
      }
      localVolumeMonitorRef.source = null;
    }
    if (localVolumeMonitorRef.analyser) {
      try {
        localVolumeMonitorRef.analyser.disconnect();
      } catch {
        
      }
      localVolumeMonitorRef.analyser = null;
    }
  }, []);

  const initializeAudioDetection = useCallback(
    async (stream: MediaStream, userId: string, roomId: string) => {
      stopDetectionLoop();

      try {
        const ctx = await getAudioContext();
        const analyser = ctx.createAnalyser();

        analyser.fftSize = SPEAKING_CONFIG.FFT_SIZE;
        analyser.smoothingTimeConstant = 0.65;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        analyserRef.current = analyser;

        const dataArray = new Float32Array(analyser.fftSize);
        const resetForConnectionLoss = () => {
          if (stopTimeoutRef.current !== null) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
          }
          wasSpeakingRef.current = false;
          dispatch(removeSpeakingUser(userId));
        };
        connectionStateUnsubscribeRef.current =
          roomSocketManager.onStateChange((state) => {
            if (state !== "connected") {
              resetForConnectionLoss();
            }
          });

        const detect = () => {
          const track = localStreamRef.current?.getAudioTracks()[0];
          const enabled =
            track?.enabled === true && track.readyState === "live";
          const connected =
            roomSocketManager.getConnectionState() === "connected";

          if (enabled && connected) {
            analyser.getFloatTimeDomainData(dataArray);
            const rms = Math.sqrt(
              dataArray.reduce((sum, sample) => sum + sample * sample, 0) /
                dataArray.length,
            );
            const threshold = wasSpeakingRef.current
              ? SPEAKING_CONFIG.SPEAKING_STOP_THRESHOLD
              : SPEAKING_CONFIG.SPEAKING_START_THRESHOLD;
            const speaking = rms >= threshold;

            if (speaking && !wasSpeakingRef.current) {
              if (stopTimeoutRef.current) {
                clearTimeout(stopTimeoutRef.current);
                stopTimeoutRef.current = null;
              }
              wasSpeakingRef.current = true;
              dispatch(setSpeakingUser(userId));
              roomSocketManager.emit("user-speaking", {
                roomId,
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

                if (connected) {
                  roomSocketManager.emit("user-speaking", {
                    roomId,
                    speaking: false,
                  });
                }
              }, SPEAKING_CONFIG.SPEAKING_STOP_DELAY);
            }
          } else if (wasSpeakingRef.current) {
            wasSpeakingRef.current = false;
            if (stopTimeoutRef.current) {
              clearTimeout(stopTimeoutRef.current);
              stopTimeoutRef.current = null;
            }
            dispatch(removeSpeakingUser(userId));
            roomSocketManager.emit("user-speaking", {
              roomId,
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
    [dispatch, getAudioContext, localStreamRef, stopDetectionLoop],
  );

  return {
    getAudioContext,
    stopDetectionLoop,
    startLocalVolumeMonitoring,
    stopLocalVolumeMonitoring,
    initializeAudioDetection,
    resetSpeakingState,
  };
}
