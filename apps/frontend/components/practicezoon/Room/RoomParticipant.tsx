import React from "react";
import { RoomMember } from "@/types/room";
import Image from "next/image";
import {
  Pin, Volume2, Crown, MicOff, Mic, ShieldCheck,
  UserX, Flag, UserMinus, ShieldPlus, MoreHorizontal,
} from "lucide-react";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";

const MOCK_MODERATOR_IDS = ["2"];

interface RoomParticipantProps {
  member: RoomMember;
  isLarge?: boolean;
  hostId: string;
  speakingUsers: string[];
  unMutedUsers: string[];
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
  recentlyJoinedIds?: string[];
}

export default function RoomParticipant({
  member,
  isLarge = false,
  hostId,
  speakingUsers,
  unMutedUsers,
  currentUserIsHost = false,
  currentUserIsModerator = false,
}: RoomParticipantProps) {
  const avatarSvg = member.avatar || generateIdenticonAvatar(member.name, 60);
  const isSpeaking = speakingUsers.includes(member.id);
  const isUnMuted = unMutedUsers.includes(member.id);
  const isHost = member.id === hostId;
  const isModerator = MOCK_MODERATOR_IDS.includes(member.id);

  // What controls does the viewer see on hover?
  const canModerate = (currentUserIsHost || currentUserIsModerator) && !isHost;
  const canHostOnly = currentUserIsHost && !isHost;

  // Role-specific ring / border accent
  const roleBorderClass = isHost
    ? "ring-amber-500/40"
    : isModerator
      ? "ring-blue-500/30"
      : "";

  const avatarBorderClass = isHost
    ? "border-amber-500/40"
    : isModerator
      ? "border-blue-500/30"
      : "border-white/10";

  return (
    <div
      className={`relative rounded-2xl overflow-hidden group transition-all duration-300 ${isLarge ? "aspect-[16/9]" : "aspect-video"
        } ${isSpeaking
          ? `ring-2 ring-green-400 ring-offset-2 ring-offset-[#0e0e0e] shadow-lg shadow-green-500/20`
          : roleBorderClass
            ? `ring-1 ${roleBorderClass}`
            : "ring-1 ring-white/[0.06]"
        }`}
      style={{ background: "rgba(22, 22, 22, 0.9)" }}
    >
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── AVATAR ──────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {member.avatar ? (
          <div className="relative">
            {/* Layered speaking ring */}
            {isSpeaking && (
              <>
                <div className="absolute inset-[-8px] rounded-full animate-ping opacity-20 bg-green-400" />
                <div className="absolute inset-[-4px] rounded-full animate-pulse opacity-30 bg-green-400" />
              </>
            )}
            <Image
              src={member.avatar}
              alt={member.name}
              width={150}
              height={150}
              className={`rounded-full object-cover border-2 transition-all duration-300 ${isLarge ? "w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36" : "w-16 h-16 sm:w-20 sm:h-20"
                } ${isSpeaking ? "border-green-400/60" : avatarBorderClass}`}
            />
          </div>
        ) : (
          <div className="relative">
            {isSpeaking && (
              <>
                <div className="absolute inset-[-8px] rounded-full animate-ping opacity-20 bg-green-400" />
                <div className="absolute inset-[-4px] rounded-full animate-pulse opacity-30 bg-green-400" />
              </>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: avatarSvg }}
              className={`
                rounded-full
                overflow-hidden
                border-2
                transition-all
                duration-300
                flex
                items-center
                justify-center
                ${isLarge ? "w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36" : "w-16 h-16 sm:w-20 sm:h-20"}
                ${isSpeaking ? "border-green-400/60" : avatarBorderClass}
              `}
            />
          </div>
        )}
      </div>

      {/* ── TOP LEFT: Mic status ─────────────────────── */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <div
          className={`p-1.5 rounded-lg transition-all duration-200 ${isUnMuted
            ? "bg-green-500/20 border border-green-500/30"
            : "bg-black/60 border border-white/[0.08]"
            }`}
        >
          {isUnMuted ? (
            <Mic size={13} className="text-green-400" />
          ) : (
            <MicOff size={13} className="text-red-400/70" />
          )}
        </div>
      </div>

      {/* ── TOP RIGHT: Role badge + actions ─────────── */}
      {/* Role badge: always visible (small), actions on hover */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">

        {/* Hover-only action cluster */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Pin & volume — visible to all */}
          <button
            className="p-1.5 rounded-lg bg-black/70 border border-white/[0.10] text-gray-300 hover:text-white hover:bg-black/90 transition-all duration-150"
            title="Pin"
          >
            <Pin size={12} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-black/70 border border-white/[0.10] text-gray-300 hover:text-white hover:bg-black/90 transition-all duration-150"
            title="Adjust volume"
          >
            <Volume2 size={12} />
          </button>

          {/* Moderator controls: mute, warn */}
          {canModerate && (
            <button
              className="p-1.5 rounded-lg bg-black/70 border border-amber-500/20 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-150"
              title={isUnMuted ? "Mute member" : "Unmute member"}
            >
              {isUnMuted ? <MicOff size={12} /> : <Mic size={12} />}
            </button>
          )}

          {/* Host-only controls: assign mod, remove */}
          {canHostOnly && (
            <>
              <button
                className="p-1.5 rounded-lg bg-black/70 border border-blue-500/20 text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
                title={isModerator ? "Remove moderator" : "Make moderator"}
              >
                {isModerator ? <UserMinus size={12} /> : <ShieldPlus size={12} />}
              </button>
              <button
                className="p-1.5 rounded-lg bg-black/70 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                title="Remove from room"
              >
                <UserX size={12} />
              </button>
            </>
          )}

          {/* Member safety actions: report, block (for all non-self) */}
          {!canModerate && !canHostOnly && (
            <>
              <button
                className="p-1.5 rounded-lg bg-black/70 border border-white/[0.10] text-gray-500 hover:text-orange-400 hover:border-orange-500/20 hover:bg-orange-500/10 transition-all duration-150"
                title="Report user"
              >
                <Flag size={12} />
              </button>
              <button
                className="p-1.5 rounded-lg bg-black/70 border border-white/[0.10] text-gray-500 hover:text-gray-200 hover:bg-white/[0.08] transition-all duration-150"
                title="More options"
              >
                <MoreHorizontal size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── SPEAKING BAR ────────────────────────────── */}
      {isSpeaking && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
          style={{ boxShadow: "0 0 8px rgba(74,222,128,0.8)" }}
        />
      )}

      {/* ── BOTTOM NAME BAR ─────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white text-xs font-semibold truncate">{member.name}</span>
            {isHost && <Crown size={11} className="text-amber-400 flex-shrink-0" />}
            {isModerator && !isHost && <ShieldCheck size={11} className="text-blue-400 flex-shrink-0" />}
          </div>
        </div>

        {/* Future: achievement badges strip (placeholder, single line) */}
        <div className="hidden group-hover:flex items-center gap-1 mt-0.5 overflow-hidden">
          <span className="text-[9px] text-gray-600 truncate">Achievements coming soon</span>
        </div>
      </div>
    </div>
  );
}