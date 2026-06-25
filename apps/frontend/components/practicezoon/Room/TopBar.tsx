import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical, Globe2, Users, Signal, ShieldCheck,
  Crown, Lock, Unlock, PhoneOff, Settings, UserX,
  Flag,
} from "lucide-react";
import { RoomType } from "@/types/room";

interface TopBarProps {
  room: RoomType | null;
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
}

// Simulated connection quality — in real use, derive from WebRTC stats
type ConnectionQuality = "good" | "fair" | "poor";


const levelConfig: Record<string, { bg: string; text: string; border: string }> = {
  Beginner:     { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  Intermediate: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20"   },
  Advanced:     { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20"  },
  Native:       { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20"    },
};

const connectionConfig: Record<ConnectionQuality, { color: string; bg: string; border: string; label: string; bars: number }> = {
  good: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Connected", bars: 3 },
  fair: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Fair signal", bars: 2 },
  poor: { color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/20",   label: "Weak signal", bars: 1 },
};

export default function TopBar({
  room,
  currentUserIsHost = false,
  currentUserIsModerator = false,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [connectionQuality] = useState<ConnectionQuality>("good");
  const menuRef = useRef<HTMLDivElement>(null);

  const level = room?.level ? (levelConfig[room.level] ?? levelConfig.Beginner) : null;
  const conn = connectionConfig[connectionQuality];

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] flex-shrink-0 relative"
      style={{ background: "rgba(14,14,14,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      {/* ── LEFT: Room info ─────────────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Live pulse */}
        <div className="flex-shrink-0 flex items-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
        </div>

        <span className="text-white font-semibold text-sm truncate max-w-[130px] sm:max-w-xs">
          {room?.title ?? "Loading…"}
        </span>

        <div className="hidden sm:block w-px h-4 bg-white/[0.08]" />

        {/* Language */}
        {room?.language && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Globe2 size={12} /> {room.language}
          </span>
        )}

        {/* Level badge */}
        {level && room?.level && (
          <span className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${level.bg} ${level.text} ${level.border}`}>
            {room.level}
          </span>
        )}

        {/* Participant count */}
        {room && (
          <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full">
            <Users size={12} />
            {room.members.length}/{room.maxParticipants}
          </span>
        )}

        {/* Room lock indicator */}
        <span
          className={`hidden md:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
            isRoomLocked
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-white/[0.04] border-white/[0.07] text-gray-600"
          }`}
        >
          {isRoomLocked ? <Lock size={11} /> : <Unlock size={11} />}
          {isRoomLocked ? "Locked" : "Open"}
        </span>

      </div>

      {/* ── RIGHT: Status + actions ──────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Connection quality */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${conn.color} ${conn.bg} ${conn.border}`}>
          <Signal size={11} />
          <span>{conn.label}</span>
        </div>

        {/* Moderator quick-action (mod only, not host) */}
        {currentUserIsModerator && !currentUserIsHost && (
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/8 text-blue-400/70 hover:text-blue-400 hover:border-blue-500/30 text-xs font-medium transition-all duration-200"
            title="Moderator tools"
          >
            <ShieldCheck size={13} /> Mod tools
          </button>
        )}

        {/* Room management menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl border border-white/[0.06] text-gray-500 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200"
            title="Room options"
          >
            <MoreVertical size={16} />
          </button>

          {/* ── DROPDOWN ──────────────────────────────── */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 rounded-xl border border-white/[0.10] bg-[#1a1a1a] shadow-2xl shadow-black/60 overflow-hidden z-50">
              {/* Host-only section */}
              {currentUserIsHost && (
                <>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/60 flex items-center gap-1.5">
                    <Crown size={9} /> Host controls
                  </div>

                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    onClick={() => { setIsRoomLocked(!isRoomLocked); setMenuOpen(false); }}
                  >
                    {isRoomLocked ? <Unlock size={14} className="text-emerald-400" /> : <Lock size={14} className="text-amber-400" />}
                    {isRoomLocked ? "Unlock room" : "Lock room"}
                  </button>

                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                    <Settings size={14} className="text-gray-400" /> Room settings
                  </button>

                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                    <Users size={14} className="text-blue-400" /> Manage join requests
                  </button>

                  <div className="border-t border-white/[0.06] my-1" />

                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/8 transition-colors">
                    <PhoneOff size={14} /> End room for all
                  </button>

                  <div className="border-t border-white/[0.06] my-1" />
                </>
              )}

              {/* Moderator section */}
              {(currentUserIsHost || currentUserIsModerator) && (
                <>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-500/60 flex items-center gap-1.5">
                    <ShieldCheck size={9} /> Moderation
                  </div>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                    <UserX size={14} className="text-orange-400" /> View reports
                  </button>
                  <div className="border-t border-white/[0.06] my-1" />
                </>
              )}

              {/* All users section */}
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                Your actions
              </div>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                <Flag size={14} className="text-orange-400/70" /> Report this room
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                <ShieldCheck size={14} className="text-emerald-400/70" /> Safety center
              </button>
              <div className="border-t border-white/[0.06] my-1" />
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors">
                <PhoneOff size={14} /> Leave room
              </button>

              {/* Moderation status footer */}
              <div className="px-3 py-2.5 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-emerald-500/60" />
                <span className="text-[10px] text-emerald-600/80">Actively moderated</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}