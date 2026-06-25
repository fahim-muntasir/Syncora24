import React, { useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Share2, Hand,
  Crown, ShieldCheck, Users,
  MicOff as MuteAll,
} from "lucide-react";
import ControlButton from "./ControlButton";
import { useAudio } from "@/context/AudioContext";
import { useAppSelector } from "@/libs/hooks";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/libs/hooks";
import { setUnMutedUser, removeUnMutedUser } from "@/libs/features/room/roomSlice";
import toast from "react-hot-toast";

export default function ControlsBar({
  currentUserIsHost = false,
  raisedHandCount = 0,
}: {
  currentUserIsHost?: boolean;
  raisedHandCount?: number;
}) {
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [hostPanelOpen, setHostPanelOpen] = useState(false);

  const { toggleMute, isMuted } = useAudio();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { id } = useParams();
  const roomId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
  const dispatch = useAppDispatch();

  const handleLeaveRoom = async () => {
    window.location.reload();
  };

  const muteHandler = () => {
    toggleMute(roomId, currentUser?.id || "");
    if (isMuted) {
      dispatch(setUnMutedUser(currentUser?.id || ""));
    } else {
      dispatch(removeUnMutedUser(currentUser?.id || ""));
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Room link copied!");
    }
  };

  return (
    <div>
      {/* ── HOST QUICK PANEL (expandable strip above bar) ── */}
      {currentUserIsHost && hostPanelOpen && (
        <div className="border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 flex-wrap bg-amber-500/[0.03]">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">
            <Crown size={9} /> Host controls
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all">
              <MuteAll size={12} className="text-amber-400" /> Mute all
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all">
              <Users size={12} className="text-blue-400" /> Manage participants
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all">
              <ShieldCheck size={12} className="text-emerald-400" /> Safety settings
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/15 transition-all">
              <PhoneOff size={12} /> End room
            </button>
          </div>
          {raisedHandCount > 0 && (
            <span className="flex items-center gap-1.5 ml-auto text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <Hand size={11} />
              {raisedHandCount} hand{raisedHandCount !== 1 ? "s" : ""} raised
            </span>
          )}
        </div>
      )}

      {/* ── MAIN BAR ──────────────────────────────────── */}
      <div className="relative w-full flex-shrink-0 border-t border-white/[0.06]"
        style={{ background: "rgba(12, 12, 12, 0.97)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>

        <div className="h-20 flex items-center px-4 sm:px-6">

          {/* ── LEFT: Session context + host shortcut ── */}
          <div className="flex items-center gap-2.5">

            {/* Host panel toggle */}
            {currentUserIsHost && (
              <button
                onClick={() => setHostPanelOpen(!hostPanelOpen)}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${hostPanelOpen
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-amber-400 hover:border-amber-500/20"
                  }`}
              >
                <Crown size={11} />
                {hostPanelOpen ? "Close" : "Host panel"}
                {raisedHandCount > 0 && !hostPanelOpen && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {raisedHandCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* ── CENTER: Core controls ─────────────────── */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-end gap-2 sm:gap-3">
            <ControlButton
              icon={isMuted ? MicOff : Mic}
              active={!isMuted}
              onClick={muteHandler}
              label={isMuted ? "Unmute" : "Mute"}
            />
            <ControlButton
              icon={isVideoOff ? VideoOff : Video}
              active={!isVideoOff}
              onClick={() => setIsVideoOff(!isVideoOff)}
              label={isVideoOff ? "Start Video" : "Stop Video"}
            />
            <ControlButton
              icon={Hand}
              active={isHandRaised}
              onClick={() => setIsHandRaised(!isHandRaised)}
              label={isHandRaised ? "Lower hand" : "Raise hand"}
            />
            <ControlButton
              icon={Share2}
              onClick={handleShare}
              label="Share"
            />

            {/* Leave — visual separation */}
            <div className="ml-2 pl-2 border-l border-white/[0.08]">
              <ControlButton
                icon={PhoneOff}
                onClick={handleLeaveRoom}
                danger
                label="Leave"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}