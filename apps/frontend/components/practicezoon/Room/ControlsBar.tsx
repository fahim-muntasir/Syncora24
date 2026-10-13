import React, { useState } from "react";
import { Hand, Mic, MicOff, MonitorUp, PhoneOff, Share2, Video, VideoOff } from "lucide-react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import ControlButton from "./ControlButton";
import { useAudio } from "@/context/AudioContext";
import { useAppSelector } from "@/libs/hooks";

export default function ControlsBar({
  canUseCamera = true,
  isVideoEnabled,
  onStartVideo,
  onStopVideo,
  isScreenSharing = false,
  onStartScreenShare,
  onStopScreenShare,
  onLeaveRoom,
}: {
  canUseCamera?: boolean;
  isVideoEnabled: boolean;
  onStartVideo: () => Promise<void>;
  onStopVideo: () => void;
  isScreenSharing?: boolean;
  onStartScreenShare?: () => Promise<void>;
  onStopScreenShare?: () => void;
  onLeaveRoom: () => void;
}) {
  const [isHandRaised, setIsHandRaised] = useState(false);
  const { toggleMute, isMuted } = useAudio();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { id } = useParams();
  const roomId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "");

  const muteHandler = () => {
    toggleMute(roomId, currentUser?.id || "");
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Room link copied!");
    }
  };

  const cameraBlocked = !isVideoEnabled && !canUseCamera;

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#111111]">
      <div className="flex h-16 items-center justify-center gap-1.5 px-3 sm:h-20 sm:gap-3">
        <ControlButton
          icon={isMuted ? MicOff : Mic}
          active={!isMuted}
          warn={isMuted}
          onClick={muteHandler}
          label={isMuted ? "Unmute" : "Mute"}
        />
        <ControlButton
          icon={isVideoEnabled ? Video : VideoOff}
          active={isVideoEnabled}
          disabled={cameraBlocked}
          onClick={
            isVideoEnabled
              ? () => onStopVideo()
              : canUseCamera
                ? () => void onStartVideo()
                : undefined
          }
          label={
            isVideoEnabled
              ? "Stop video"
              : canUseCamera
                ? "Start video"
                : "Camera disabled by moderator"
          }
        />
        <ControlButton
          icon={Hand}
          active={isHandRaised}
          onClick={() => setIsHandRaised(!isHandRaised)}
          label={isHandRaised ? "Lower hand" : "Raise hand"}
        />
        <ControlButton icon={Share2} onClick={handleShare} label="Copy invite link" />
        <ControlButton
          icon={MonitorUp}
          active={isScreenSharing}
          onClick={
            isScreenSharing
              ? () => onStopScreenShare?.()
              : () => void onStartScreenShare?.()
          }
          label={isScreenSharing ? "Stop sharing" : "Share screen"}
        />

        <span className="mx-1 h-6 w-px bg-white/[0.08] sm:mx-2" aria-hidden="true" />

        <ControlButton icon={PhoneOff} onClick={onLeaveRoom} danger label="Leave" />
      </div>
    </div>
  );
}