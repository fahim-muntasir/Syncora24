"use client";

import React from "react";
import Image from "next/image";
import { Crown, Mic, MicOff, ShieldCheck, ShieldPlus, UserX, Video, ArrowLeftRight } from "lucide-react";
import toast from "react-hot-toast";
import { roomSocketManager } from "@/libs/socket/index";
import { useAppSelector } from "@/libs/hooks";
import { RoomType } from "@/types/room";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";
import { useAudio } from "@/context/AudioContext";
import type { ParticipantConnectionState } from "@/libs/features/room/roomSlice";
import ActionMenu from "./ActionMenu";
import type { MenuItem } from "./ActionMenu";

type Role = "host" | "moderator" | "member";

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
  currentUserIsModerator?: boolean;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const forceMutedUsers = useAppSelector((state) => state.room.forceMutedUsers);
  const muteAll = useAppSelector((state) => state.room.muteAll);
  const muteAllExcludedUsers = useAppSelector((state) => state.room.muteAllExcludedUsers);
  const moderatorIds = useAppSelector((state) => state.room.moderatorIds);
  const cameraDisabledMemberIds = useAppSelector(
    (state) => state.room.cameraDisabledMemberIds,
  );
  const participantConnectionStates = useAppSelector(
    (state) => state.room.participantConnectionStates,
  );
  const currentUserIsModerator = currentUser?.id ? moderatorIds.includes(currentUser.id) : false;

  const { toggleMute } = useAudio();
  const debateCounts = {
    for: room?.members.filter((member) => member.side === "for").length ?? 0,
    against: room?.members.filter((member) => member.side === "against").length ?? 0,
  };

  const handleChangeSide = async (currentSide: "for" | "against") => {
    if (!room?.id) return;
    const nextSide = currentSide === "for" ? "against" : "for";
    const nextLabel = nextSide === "for" ? "For" : "Against";
    if (!window.confirm(`Change your debate position to ${nextLabel}?`)) return;

    try {
      await roomSocketManager.emitWithAck<{
        success: boolean;
        message?: string;
        code?: string;
      }>("change-debate-side", { roomId: room.id, side: nextSide });
      toast.success(`Your position is now ${nextLabel}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to change your debate position.";
      toast.error(message);
    }
  };

  if (!room) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-600">
        Loading participants…
      </div>
    );
  }

  const currentRoom = room;
  const isDebateRoom = currentRoom.type === "debate";

  const host = currentRoom.members.filter((m) => m.id === currentRoom.hostId);
  const moderators = currentRoom.members.filter(
    (m) => moderatorIds.includes(m.id) && m.id !== currentRoom.hostId,
  );
  const members = currentRoom.members.filter(
    (m) => m.id !== currentRoom.hostId && !moderatorIds.includes(m.id),
  );

  const canModerateMember = (memberId: string) => {
    if (memberId === currentUser?.id) return false;
    if (memberId === currentRoom.hostId) return false;
    return Boolean(currentUserIsHost || currentUserIsModerator);
  };

  const handleMuteToggle = (memberId: string) => {
    if (!currentRoom.id) return;

    if (memberId === currentUser?.id) {
      toggleMute(currentRoom.id, memberId);
      return;
    }

    if (!canModerateMember(memberId)) return;

    if (forceMutedUsers.includes(memberId)) {
      roomSocketManager.emit("moderator-unmute-user", {
        roomId: currentRoom.id,
        targetUserId: memberId,
      });
    } else {
      roomSocketManager.emit("moderator-mute-user", {
        roomId: currentRoom.id,
        targetUserId: memberId,
      });
    }
  };

  const handleKick = (memberId: string) => {
    if (!currentRoom.id || !canModerateMember(memberId)) return;
    roomSocketManager.emit("kick-member", {
      roomId: currentRoom.id,
      targetUserId: memberId,
    });
  };

  const renderMember = (member: (typeof currentRoom.members)[0], role: Role) => {
    const isSpeaking = speakingUsers.includes(member.id);
    const isForceMuted = forceMutedUsers.includes(member.id);
    const isMutedByMuteAll = muteAll && !muteAllExcludedUsers.includes(member.id);
    const isLocallyUnmuted = unMutedUsers.includes(member.id);
    const isUnMuted = isLocallyUnmuted && !isForceMuted && !isMutedByMuteAll;
    const isMuted = !isUnMuted;
    const isSelf = member.id === currentUser?.id;
    const isModerator = role === "moderator";

    const connectionState: ParticipantConnectionState =
      participantConnectionStates[member.id] ?? "connected";
    const connectionLabel = {
      connected: "Connected",
      "connection-lost": "Connection lost",
      reconnecting: "Reconnecting…",
      disconnected: "Disconnected",
    }[connectionState];

    const canModerate = canModerateMember(member.id);
    const canKick = canModerate && (currentUserIsHost || !isModerator);
    const showSpeaking = isSpeaking && !isMuted;

    const avatarSvg = !member.avatar ? generateIdenticonAvatar(member.name, 36) : null;

    const selfItems: MenuItem[] = [];
    if (isSelf) {
      selfItems.push({
        type: "toggle",
        id: "own-mic",
        label: "My microphone",
        icon: Mic,
        checked: !isMuted,
        onChange: () => handleMuteToggle(member.id),
      });
      if (isDebateRoom && member.side) {
        const side = member.side;
        selfItems.push({
          type: "action",
          id: "switch-side",
          label: `Switch to ${side === "for" ? "Against" : "For"}`,
          icon: ArrowLeftRight,
          onSelect: () => void handleChangeSide(side),
        });
      }
    }

    const modItems: MenuItem[] = [];
    if (canModerate) {
      modItems.push(
        { type: "heading", id: "mod-heading", text: "Moderation" },
        {
          type: "toggle",
          id: "camera-access",
          label: "Camera access",
          icon: Video,
          checked: !cameraDisabledMemberIds.includes(member.id),
          onChange: (next) =>
            roomSocketManager.emit("moderator-set-member-camera", {
              roomId: currentRoom.id,
              targetUserId: member.id,
              cameraEnabled: next,
            }),
        },
        {
          type: "toggle",
          id: "mute",
          label: "Mute participant",
          icon: MicOff,
          checked: isForceMuted,
          onChange: () => handleMuteToggle(member.id),
        },
      );
      if (currentUserIsHost) {
        modItems.push({
          type: "toggle",
          id: "moderator",
          label: "Moderator role",
          icon: ShieldPlus,
          checked: isModerator,
          onChange: (next) =>
            roomSocketManager.emit("set-moderator-role", {
              roomId: currentRoom.id,
              targetUserId: member.id,
              isModerator: next,
            }),
        });
      }
    }

    const dangerItems: MenuItem[] = canKick
      ? [
          {
            type: "action",
            id: "kick",
            label: "Remove from room",
            icon: UserX,
            danger: true,
            onSelect: () => handleKick(member.id),
          },
        ]
      : [];

    const menuItems = [selfItems, modItems, dangerItems]
      .filter((group) => group.length > 0)
      .flatMap<MenuItem>((group, index) =>
        index === 0 ? group : [{ type: "separator", id: `sep-${index}` }, ...group],
      );

    const roleLabel = role === "host" ? "Host" : role === "moderator" ? "Moderator" : "Member";

    return (
      <div
        key={member.id}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] motion-reduce:transition-none"
      >
        <div
          className={`relative shrink-0 rounded-full ${
            showSpeaking ? "ring-2 ring-emerald-400" : ""
          }`}
        >
          {member.avatar ? (
            <Image
              src={member.avatar}
              alt={member.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: avatarSvg ?? "" }}
              className="h-9 w-9 overflow-hidden rounded-full border border-white/10"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-medium text-white">
              {member.name}
              {isSelf && <span className="text-gray-500"> (You)</span>}
            </span>
            {role === "host" && <Crown size={11} className="shrink-0 text-amber-400" />}
            {role === "moderator" && <ShieldCheck size={11} className="shrink-0 text-blue-400" />}
            {showSpeaking && (
              <span className="shrink-0 text-[10px] font-medium text-emerald-400">Speaking</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-gray-500">
            <span>{roleLabel}</span>
            {isDebateRoom && member.side && (
              <span className={member.side === "for" ? "text-emerald-300" : "text-rose-300"}>
                · {member.side === "for" ? "For" : "Against"}
              </span>
            )}
            {connectionState !== "connected" && (
              <span
                role="status"
                className={connectionState === "disconnected" ? "text-red-400" : "text-amber-400"}
              >
                · {connectionLabel}
              </span>
            )}
            {isForceMuted && <span className="text-red-400/80">· Muted by moderator</span>}
            {!isForceMuted && isMutedByMuteAll && (
              <span className="text-amber-400/80">· Muted by host</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            role="img"
            aria-label={isMuted ? "Microphone muted" : "Microphone on"}
            title={isMuted ? "Microphone muted" : "Microphone on"}
            className="flex h-7 w-7 items-center justify-center"
          >
            {isMuted ? (
              <MicOff size={13} className="text-red-400" />
            ) : (
              <Mic size={13} className="text-emerald-400" />
            )}
          </span>
          {menuItems.length > 0 && (
            <ActionMenu items={menuItems} label={`Actions for ${member.name}`} />
          )}
        </div>
      </div>
    );
  };

  const groupTitle = "mb-1.5 flex items-center gap-1.5 px-2.5 text-[10px] font-medium uppercase tracking-wider text-gray-500";

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {isDebateRoom && (
        <div className="mx-2 grid grid-cols-2 divide-x divide-white/[0.06] rounded-lg border border-white/[0.07] bg-[#161616] text-xs">
          <span className="px-3 py-2 text-emerald-300">For · {debateCounts.for}</span>
          <span className="px-3 py-2 text-rose-300">Against · {debateCounts.against}</span>
        </div>
      )}

      {host.length > 0 && (
        <div>
          <h3 className={groupTitle}>Host</h3>
          {host.map((m) => renderMember(m, "host"))}
        </div>
      )}

      {moderators.length > 0 && (
        <div>
          <h3 className={groupTitle}>Moderators · {moderators.length}</h3>
          {moderators.map((m) => renderMember(m, "moderator"))}
        </div>
      )}

      {members.length > 0 && (
        <div>
          <h3 className={groupTitle}>Members · {members.length}</h3>
          {members.map((m) => renderMember(m, "member"))}
        </div>
      )}
    </div>
  );
}