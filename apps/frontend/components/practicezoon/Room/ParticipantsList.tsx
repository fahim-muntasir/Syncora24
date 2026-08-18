"use client";

import React from "react";
import { ShieldCheck, Crown, Mic, MicOff, UserMinus, Flag, Sparkles } from "lucide-react";
import { socketManager } from "@/libs/socket/index";
import { useAppSelector } from "@/libs/hooks";
import { RoomType } from "@/types/room";
import Image from "next/image";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";
import { useAudio } from "@/context/AudioContext";

const MOCK_MODERATOR_IDS = ["2"];

export default function ParticipantsList({
  room,
  speakingUsers,
  unMutedUsers,
  currentUserIsHost,
}: {
  room: RoomType | null;
  speakingUsers: string[];
  unMutedUsers: string[];
  currentUserIsHost?: boolean;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);

  const forceMutedUsers = useAppSelector(
    (state) => state.room.forceMutedUsers
  );

  const muteAll = useAppSelector(
    (state) => state.room.muteAll
  );

  const muteAllExcludedUsers = useAppSelector(
    (state) => state.room.muteAllExcludedUsers
  );

  const { toggleMute } = useAudio();

  if (!room) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
        Loading participants…
      </div>
    );
  }

  const host = room.members.filter((m) => m.id === room.hostId);

  const moderators = room.members.filter((m) => MOCK_MODERATOR_IDS.includes(m.id) && m.id !== room.hostId);

  const members = room.members.filter((m) => m.id !== room.hostId && !MOCK_MODERATOR_IDS.includes(m.id));

  const currentUserIsModerator = currentUser?.id ? MOCK_MODERATOR_IDS.includes(currentUser.id) : false;

  const canModerateMember = (memberId: string) => {
    // Cannot moderate yourself
    if (memberId === currentUser?.id) {
      return false;
    }

    // Cannot mute host
    if (memberId === room.hostId) {
      return false;
    }

    return (
      currentUserIsHost ||
      currentUserIsModerator
    );
  };

  const handleMuteToggle = (memberId: string) => {
    if (!room.id) return;

    const isSelf = memberId === currentUser?.id;

    if (isSelf) {
      toggleMute(room.id, memberId);
      return;
    }

    if (!canModerateMember(memberId)) {
      return;
    }

    const isForceMuted =
      forceMutedUsers.includes(memberId);

    if (isForceMuted) {
      socketManager.emit(
        "moderator-unmute-user",
        {
          roomId: room.id,
          targetUserId: memberId,
        }
      );
    } else {
      socketManager.emit(
        "moderator-mute-user",
        {
          roomId: room.id,
          targetUserId: memberId,
        }
      );
    }
  };

  const renderMember = (
    member: typeof room.members[0],
    roleLabel: string,
    roleColor: string
  ) => {
    const isSpeaking = speakingUsers.includes(member.id);

    const isForceMuted = forceMutedUsers.includes(member.id);

    const isMutedByMuteAll = muteAll && !muteAllExcludedUsers.includes(member.id);

    const isLocallyUnmuted = unMutedUsers.includes(member.id);

    const isUnMuted = isLocallyUnmuted && !isForceMuted && !isMutedByMuteAll;

    const isMuted = !isUnMuted;

    const isSelf = member.id === currentUser?.id;

    const canModerate = canModerateMember(member.id);

    const avatarSvg = !member.avatar ? generateIdenticonAvatar(member.name, 36) : null;

    return (
      <div
        key={member.id}
        className="group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors duration-200 hover:bg-white/[0.04]"
      >

        <div className="relative flex-shrink-0">
          {member.avatar ? (
            <Image
              src={member.avatar}
              alt={member.name}
              width={36}
              height={36}
              className={`w-9 h-9 rounded-full object-cover border ${isForceMuted ? "border-red-500/30" : "border-white/10"
                }`}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: avatarSvg! }}
              className={`w-9 h-9 rounded-full overflow-hidden border ${isForceMuted ? "border-red-500/30" : "border-white/10"
                }`}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-medium truncate">
              {member.name}
            </span>

            {isSpeaking && !isMuted && (
              <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-400 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Speaking
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-medium ${roleColor}`}>
              {roleLabel}
            </span>

            {isForceMuted && (
              <span className="text-[9px] text-red-400/70">
                • Force muted
              </span>
            )}

            {!isForceMuted && isMutedByMuteAll && (
              <span className="text-[9px] text-orange-400/60">
                • Muted by host
              </span>
            )}
          </div>
        </div>

        {/* Right: actions + mic */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {canModerate && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
              <button
                type="button"
                className="p-1 rounded-md hover:bg-white/[0.08] text-gray-600 hover:text-orange-400 transition-colors"
                title="Remove"
              >
                <UserMinus size={11} />
              </button>

              <button
                type="button"
                className="p-1 rounded-md hover:bg-white/[0.08] text-gray-600 hover:text-blue-400 transition-colors"
                title="Report"
              >
                <Flag size={11} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleMuteToggle(member.id)}
            disabled={!isSelf && !canModerate}
            className={`p-1 rounded-md transition-all ${isSelf || canModerate
              ? "cursor-pointer hover:bg-white/[0.08]"
              : "cursor-default"
              } ${isMuted
                ? "text-red-400/60"
                : "text-green-400/80"
              }`}
            title={
              isSelf
                ? isMuted
                  ? "Unmute yourself"
                  : "Mute yourself"
                : canModerate
                  ? isForceMuted
                    ? "Unmute member"
                    : "Mute member"
                  : isMuted
                    ? "Muted"
                    : "Unmuted"
            }
          >
            {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

      {/* Host */}
      {host.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <Crown
              size={10}
              className="text-amber-400/70"
            />

            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
              Host
            </span>
          </div>

          {host.map((m) =>
            renderMember(
              m,
              "Host",
              "text-amber-400"
            )
          )}
        </div>
      )}

      {/* Moderators */}
      {moderators.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <ShieldCheck
              size={10}
              className="text-blue-400/70"
            />

            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/60">
              Moderators
            </span>
          </div>

          {moderators.map((m) =>
            renderMember(
              m,
              "Moderator",
              "text-blue-400"
            )
          )}
        </div>
      )}

      {/* Members */}
      {members.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Members · {members.length}
            </span>
          </div>

          {members.map((m) =>
            renderMember(
              m,
              "Member",
              "text-gray-500"
            )
          )}
        </div>
      )}

      {/* AI Insights */}
      <div className="mx-1 p-3 rounded-xl border border-dashed border-purple-500/15 bg-purple-500/3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles
            size={12}
            className="text-purple-400/40"
          />

          <span className="text-[10px] font-semibold text-purple-400/40 uppercase tracking-wider">
            AI Insights
          </span>

          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/15 text-purple-400/50">
            Soon
          </span>
        </div>

        <p className="text-[10px] text-gray-700">
          Participation scores, speaking time,
          communication streaks and country badges
          will appear here.
        </p>
      </div>
    </div>
  );
}