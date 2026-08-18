import React from "react";
import { RoomMember } from "@/types/room";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Pin,
  Volume2,
  Crown,
  MicOff,
  Mic,
  ShieldCheck,
  UserX,
  Flag,
  UserMinus,
  ShieldPlus,
  MoreHorizontal,
} from "lucide-react";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";
import { useAudio } from "@/context/AudioContext";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { removeUnMutedUser } from "@/libs/features/room/roomSlice";
import VolumeIndicator from "./VolumeIndicator";

const MOCK_MODERATOR_IDS = ["2"];

interface RoomParticipantProps {
  member: RoomMember;
  isLarge?: boolean;
  hostId: string;
  speakingUsers: string[];
  unMutedUsers: string[];
  forceMutedUsers: string[];
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
  recentlyJoinedIds?: string[];
  muteAll?: boolean;
  muteAllExcludedUsers?: string[];
}

export default function RoomParticipant({
  member,
  isLarge = false,
  hostId,
  speakingUsers,
  unMutedUsers,
  forceMutedUsers,
  currentUserIsHost = false,
  currentUserIsModerator = false,
  muteAll = false,
  muteAllExcludedUsers = [],
}: RoomParticipantProps) {
  const volume = useAppSelector((state) => state.room.volumeLevels[member.id] ?? 0);

  const avatarSvg = member.avatar || generateIdenticonAvatar(member.name, 60);

  const { id } = useParams();
  const roomId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "");

  const isSpeaking = speakingUsers.includes(member.id);
  const isForceMuted =
    forceMutedUsers.includes(member.id) ||
    (muteAll && !muteAllExcludedUsers.includes(member.id));

  const isUnMuted = unMutedUsers.includes(member.id) && !isForceMuted;

  const isHost = member.id === hostId;
  const isModerator = MOCK_MODERATOR_IDS.includes(member.id);

  const dispatch = useAppDispatch();

  const { forceMuteUser, forceUnmuteUser } = useAudio();

  const canModerate = (currentUserIsHost || currentUserIsModerator) && !isHost;
  const canHostOnly = currentUserIsHost && !isHost;

  const forceMuteHandler = () => {
    if (isForceMuted) {
      forceUnmuteUser(roomId, member.id);
    } else {
      if (isUnMuted) {
        dispatch(removeUnMutedUser(member.id));
      }
      forceMuteUser(roomId, member.id);
    }
  };

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
      className={`
        relative rounded-2xl overflow-hidden group transition-all duration-300
        ${isLarge ? "aspect-[16/9]" : "aspect-video"}
        ${roleBorderClass ? `ring-1 ${roleBorderClass}` : "ring-1 ring-white/[0.06]"}
      `}
      style={{
        background: "linear-gradient(135deg, rgba(22, 22, 22, 0.95) 0%, rgba(28, 28, 28, 0.95) 100%)",
      }}
    >
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {member.avatar ? (
          <div className={` relative rounded-full ${isSpeaking && isUnMuted ? "ring-2 ring-emerald-400/70" : ""}`} >
            <Image
              src={member.avatar}
              alt={member.name}
              width={150}
              height={150}
              className={`
                rounded-full object-cover border-2
                ${isLarge
                  ? "w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36"
                  : "w-16 h-16 sm:w-20 sm:h-20"
                }
                ${avatarBorderClass}
              `}
            />
          </div>
        ) : (
          <div
            className={`relative rounded-full ${isSpeaking && isUnMuted ? "ring-2 ring-emerald-400/70" : ""}`}
          >
            <div
              dangerouslySetInnerHTML={{ __html: avatarSvg }}
              className={`rounded-full overflow-hidden border-2 flex items-center justify-center ${isLarge ? "w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36" : "w-16 h-16 sm:w-20 sm:h-20"} ${avatarBorderClass}`}
            />
          </div>
        )}
      </div>

      <div className="absolute top-3 left-3 z-10">
        {isUnMuted ? (
          <div className="flex items-center gap-2">
            <Mic
              size={14}
              strokeWidth={2.5}
              className="text-emerald-400"
              aria-label="Microphone on"
            />
          </div>
        ) : (
          <MicOff
            size={14}
            strokeWidth={2.5}
            className="text-red-400/70"
            aria-label="Microphone muted"
          />
        )}
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.12] text-gray-400 hover:text-white hover:bg-black/70 hover:border-white/20 transition-all duration-150"
            title="Pin"
          >
            <Pin size={12} strokeWidth={2} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.12] text-gray-400 hover:text-white hover:bg-black/70 hover:border-white/20 transition-all duration-150"
            title="Adjust volume"
          >
            <Volume2 size={12} strokeWidth={2} />
          </button>

          {canModerate && (
            <button
              type="button"
              className={`
                p-1.5 rounded-lg backdrop-blur-sm border transition-all duration-150
                ${isForceMuted
                  ? "bg-green-500/15 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/25 hover:border-green-500/50"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/50"
                }
              `}
              title={isForceMuted ? "Unmute member" : "Mute member"}
              onClick={forceMuteHandler}
            >
              {isForceMuted ? (
                <MicOff size={12} strokeWidth={2} />
              ) : (
                <Mic size={12} strokeWidth={2} />
              )}
            </button>
          )}

          {canHostOnly && (
            <>
              <button
                className="p-1.5 rounded-lg bg-blue-500/15 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/25 hover:border-blue-500/50 transition-all duration-150"
                title={isModerator ? "Remove moderator" : "Make moderator"}
              >
                {isModerator ? (
                  <UserMinus size={12} strokeWidth={2} />
                ) : (
                  <ShieldPlus size={12} strokeWidth={2} />
                )}
              </button>
              <button
                className="p-1.5 rounded-lg bg-red-500/15 backdrop-blur-sm border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/25 hover:border-red-500/50 transition-all duration-150"
                title="Remove from room"
              >
                <UserX size={12} strokeWidth={2} />
              </button>
            </>
          )}

          {!canModerate && !canHostOnly && (
            <>
              <button
                className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.12] text-gray-500 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/15 transition-all duration-150"
                title="Report user"
              >
                <Flag size={12} strokeWidth={2} />
              </button>
              <button
                className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/[0.12] text-gray-500 hover:text-gray-200 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-150"
                title="More options"
              >
                <MoreHorizontal size={12} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-white text-xs font-semibold truncate">
              {member.name}
            </span>

            {isHost && (
              <Crown
                size={12}
                className="text-amber-400 flex-shrink-0"
                strokeWidth={2}
              />
            )}

            {isModerator && !isHost && (
              <ShieldCheck
                size={12}
                className="text-blue-400 flex-shrink-0"
                strokeWidth={2}
              />
            )}

            {isSpeaking && isUnMuted && (
              <div className="flex-shrink-0">
                <VolumeIndicator volume={volume} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}