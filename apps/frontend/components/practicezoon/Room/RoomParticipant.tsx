import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Crown,
  Eye,
  Mic,
  MicOff,
  Monitor,
  MonitorUp,
  ShieldCheck,
  ShieldPlus,
  UserX,
  Video,
  VideoOff,
} from "lucide-react";
import { RoomMember } from "@/types/room";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";
import { useAudio } from "@/context/AudioContext";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { removeUnMutedUser } from "@/libs/features/room/roomSlice";
import { roomSocketManager } from "@/libs/socket";
import VolumeIndicator from "./VolumeIndicator";
import ActionMenu from "./ActionMenu";
import type { MenuItem } from "./ActionMenu";

interface RoomParticipantProps {
  member: RoomMember;
  hostId: string;
  speakingUsers: string[];
  unMutedUsers: string[];
  forceMutedUsers: string[];
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
  moderatorIds: string[];
  recentlyJoinedIds?: string[];
  muteAll?: boolean;
  muteAllExcludedUsers?: string[];
  currentUserId?: string;
  videoStream: MediaStream | null;
  screenShareStream: MediaStream | null;
  onSelectScreenShare: (userId: string) => void;
  onSelectCamera: (userId: string) => void;
  cameraEnabled: boolean;
  isVideoEnabled: boolean;
  onStartVideo: () => Promise<void>;
  onStopVideo: () => void;
  cameraDisabled: boolean;
  onToggleMemberCamera: (enabled: boolean) => void;
  compact?: boolean;
  isDebateRoom?: boolean;
}

function Status({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "on" | "off" | "alert";
  children: React.ReactNode;
}) {
  const color =
    tone === "on" ? "text-emerald-400" : tone === "alert" ? "text-red-400" : "text-gray-400";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`flex h-6 w-6 items-center justify-center rounded-md ${color}`}
    >
      {children}
    </span>
  );
}

export default function RoomParticipant({
  member,
  hostId,
  speakingUsers,
  unMutedUsers,
  forceMutedUsers,
  currentUserIsHost = false,
  currentUserIsModerator = false,
  moderatorIds,
  muteAll = false,
  muteAllExcludedUsers = [],
  currentUserId,
  videoStream,
  screenShareStream,
  onSelectScreenShare,
  onSelectCamera,
  cameraEnabled,
  isVideoEnabled,
  onStartVideo,
  onStopVideo,
  cameraDisabled,
  onToggleMemberCamera,
  compact = false,
  isDebateRoom = false,
}: RoomParticipantProps) {
  const volume = useAppSelector((state) => state.room.volumeLevels[member.id] ?? 0);
  const connectionState = useAppSelector(
    (state) => state.room.participantConnectionStates[member.id] ?? "connected",
  );
  const connectionLabel = {
    connected: "Connected",
    "connection-lost": "Connection lost",
    reconnecting: "Reconnecting…",
    disconnected: "Disconnected",
  }[connectionState];
  const connectionTone =
    connectionState === "disconnected" ? "text-red-400" : "text-amber-400";

  const avatarSvg = member.avatar ? null : generateIdenticonAvatar(member.name, 60);

  const { id } = useParams();
  const roomId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "");

  const isSelf = member.id === currentUserId;
  const isSpeaking = speakingUsers.includes(member.id);
  const isForceMuted =
    forceMutedUsers.includes(member.id) ||
    (muteAll && !muteAllExcludedUsers.includes(member.id));
  const isUnMuted = unMutedUsers.includes(member.id) && !isForceMuted;
  const isActiveSpeaker = isSpeaking && isUnMuted;

  const isHost = member.id === hostId;
  const isModerator = moderatorIds.includes(member.id);

  const dispatch = useAppDispatch();
  const { forceMuteUser, forceUnmuteUser } = useAudio();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = videoStream;
  }, [videoStream]);

  const canModerate = (currentUserIsHost || currentUserIsModerator) && !isHost;
  const canKick =
    canModerate && !isSelf && (currentUserIsHost || !isModerator);
  const canHostOnly = currentUserIsHost && !isHost;

  const forceMuteHandler = () => {
    if (isForceMuted) {
      forceUnmuteUser(roomId, member.id);
    } else {
      if (isUnMuted) dispatch(removeUnMutedUser(member.id));
      forceMuteUser(roomId, member.id);
    }
  };

  const kickHandler = () => {
    if (!canKick) return;
    roomSocketManager.emit("kick-member", { roomId, targetUserId: member.id });
  };

  const moderatorRoleHandler = () => {
    if (!currentUserIsHost || isHost) return;
    roomSocketManager.emit("set-moderator-role", {
      roomId,
      targetUserId: member.id,
      isModerator: !isModerator,
    });
  };

  const viewItems: MenuItem[] = [];
  if (videoStream) {
    viewItems.push({
      type: "action",
      id: "view-camera",
      label: "View camera",
      icon: Eye,
      onSelect: () => onSelectCamera(member.id),
    });
  }
  if (screenShareStream && !isSelf) {
    viewItems.push({
      type: "action",
      id: "view-screen",
      label: "View shared screen",
      icon: Monitor,
      onSelect: () => onSelectScreenShare(member.id),
    });
  }

  const selfItems: MenuItem[] = [];
  if (isSelf) {
    const blocked = !isVideoEnabled && (!cameraEnabled || cameraDisabled);
    selfItems.push({
      type: "toggle",
      id: "own-camera",
      label: "My camera",
      icon: isVideoEnabled ? Video : VideoOff,
      checked: isVideoEnabled,
      disabled: blocked,
      hint: blocked
        ? !cameraEnabled
          ? "Disabled by a moderator"
          : "Disabled for you"
        : undefined,
      onChange: (next) => {
        if (next) void onStartVideo();
        else onStopVideo();
      },
    });
  }

  const modItems: MenuItem[] = [];
  if (canModerate) {
    modItems.push({ type: "heading", id: "mod-heading", text: "Moderation" });
    if (!isSelf) {
      modItems.push({
        type: "toggle",
        id: "camera-access",
        label: "Camera access",
        icon: Video,
        checked: !cameraDisabled,
        onChange: (next) => onToggleMemberCamera(next),
      });
    }
    modItems.push({
      type: "toggle",
      id: "mute",
      label: "Mute participant",
      icon: MicOff,
      checked: isForceMuted,
      onChange: () => forceMuteHandler(),
    });
    if (canHostOnly) {
      modItems.push({
        type: "toggle",
        id: "moderator",
        label: "Moderator role",
        icon: ShieldPlus,
        checked: isModerator,
        onChange: () => moderatorRoleHandler(),
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
          onSelect: kickHandler,
        },
      ]
    : [];

  const menuItems = [viewItems, selfItems, modItems, dangerItems]
    .filter((group) => group.length > 0)
    .flatMap<MenuItem>((group, index) =>
      index === 0 ? group : [{ type: "separator", id: `sep-${index}` }, ...group],
    );

  const avatarSize = compact ? "h-9 w-9" : "h-14 w-14 sm:h-16 sm:w-16";
  const avatarBorder = "border-2 border-white/10";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-[#161616] ${
        compact ? "h-full w-[168px] min-w-[168px]" : "aspect-video w-full"
      } ${isActiveSpeaker ? "ring-2 ring-emerald-400" : "ring-1 ring-white/[0.07]"}`}
    >
      {videoStream && (
        <button
          type="button"
          onClick={() => onSelectCamera(member.id)}
          className="absolute inset-0 z-[1] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
          aria-label={`View ${member.name}'s camera`}
          title={`View ${member.name}'s camera`}
        >
          <video
            ref={videoRef}
            autoPlay
            muted={isSelf}
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        </button>
      )}

      {!videoStream && (
        <div className="absolute inset-0 flex items-center justify-center">
          {member.avatar ? (
            <Image
              src={member.avatar}
              alt={member.name}
              width={150}
              height={150}
              className={`rounded-full object-cover ${avatarSize} ${avatarBorder}`}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: avatarSvg ?? "" }}
              className={`flex items-center justify-center overflow-hidden rounded-full ${avatarSize} ${avatarBorder}`}
            />
          )}
        </div>
      )}

      {screenShareStream &&
        (isSelf ? (
          <span className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
            <MonitorUp size={12} className="text-emerald-400" />
            {compact ? "You" : "Sharing your screen"}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelectScreenShare(member.id)}
            title={`View ${member.name}'s screen`}
            className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
          >
            <MonitorUp size={12} className="text-emerald-400" />
            {compact ? "Screen" : "Sharing screen · View"}
          </button>
        ))}

      {menuItems.length > 0 && member.id !== currentUserId && (
        <div className="absolute right-1.5 top-1.5 z-10">
          <ActionMenu
            items={menuItems}
            label={`Actions for ${member.name}`}
          />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 bg-transparent px-2.5 pb-2 pt-8">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-medium text-white">
              {member.name}
              {isSelf && <span className="text-gray-400"> (You)</span>}
            </span>
            {isHost && <Crown size={12} className="shrink-0 text-amber-400" />}
            {isModerator && !isHost && (
              <ShieldCheck size={12} className="shrink-0 text-blue-400" />
            )}
          </div>

          {isDebateRoom && member.side && (
            <span
              className={`block text-[10px] font-medium ${
                member.side === "for" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {member.side === "for" ? "For" : "Against"}
            </span>
          )}

          {connectionState !== "connected" && (
            <span
              role="status"
              className={`flex items-center gap-1 text-[10px] ${connectionTone}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {connectionLabel}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isActiveSpeaker && <VolumeIndicator volume={volume} />}
          {isUnMuted ? (
            <Status label="Microphone on" tone="on">
              <Mic size={13} />
            </Status>
          ) : (
            <Status label="Microphone muted" tone="alert">
              <MicOff size={13} />
            </Status>
          )}
        </div>
      </div>
    </div>
  );
}