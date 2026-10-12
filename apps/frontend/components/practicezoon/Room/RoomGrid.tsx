import React, { useEffect, useState } from "react";
import { Copy, Users } from "lucide-react";
import toast from "react-hot-toast";
import RoomParticipant from "./RoomParticipant";
import { RoomType } from "@/types/room";
import { useAppSelector } from "@/libs/hooks";
import { useSpeakingEvents } from "@/hooks/useSpeakingEvents";
import { roomSocketManager } from "@/libs/socket";

type Member = RoomType["members"][number];

function useRecentlyJoined(members: RoomType["members"]) {
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const prevIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(members.map((m) => m.id));
    const newIds: string[] = [];

    currentIds.forEach((id) => {
      if (!prevIdsRef.current.has(id)) newIds.push(id);
    });

    if (newIds.length > 0) {
      setRecentIds((prev) => new Set([...prev, ...newIds]));

      const timeout = setTimeout(() => {
        setRecentIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 60_000);

      prevIdsRef.current = currentIds;
      return () => clearTimeout(timeout);
    }

    prevIdsRef.current = currentIds;
  }, [members]);

  return [...recentIds];
}

function SideGroup({
  title,
  tone,
  members,
  emptyText,
  render,
  className = "",
}: {
  title: string;
  tone: "for" | "against" | "none";
  members: Member[];
  emptyText: string;
  render: (member: Member) => React.ReactNode;
  className?: string;
}) {
  const toneText =
    tone === "for"
      ? "text-emerald-300"
      : tone === "against"
        ? "text-rose-300"
        : "text-gray-400";
  const toneBorder =
    tone === "for"
      ? "border-t-emerald-500/50"
      : tone === "against"
        ? "border-t-rose-500/50"
        : "border-t-white/[0.14]";

  return (
    <section
      aria-label={title}
      className={`min-w-0 rounded-xl border border-t-2 border-white/[0.07] ${toneBorder} bg-[#141414]/50 p-3 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${toneText}`}>
          {title}
        </h3>
        <span className="text-xs tabular-nums text-gray-500">{members.length}</span>
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg px-3 py-6 text-center text-sm text-gray-600">
          {emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {members.map(render)}
        </div>
      )}
    </section>
  );
}

export default function RoomGrid({
  room,
  isJoined,
  currentUserIsHost = false,
  currentUserIsModerator = false,
  currentUserId,
  localVideoStream,
  remoteVideoStreams,
  screenShareStreams,
  onSelectScreenShare,
  onSelectCamera,
  compact = false,
  isVideoEnabled,
  startVideo,
  stopVideo,
}: {
  layout?: string;
  room: RoomType | null;
  isJoined: boolean;
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
  currentUserId?: string;
  localVideoStream: MediaStream | null;
  remoteVideoStreams: Record<string, MediaStream>;
  screenShareStreams: Record<string, MediaStream>;
  onSelectScreenShare: (userId: string) => void;
  onSelectCamera: (userId: string) => void;
  compact?: boolean;
  isVideoEnabled: boolean;
  startVideo: () => Promise<void>;
  stopVideo: () => void;
}) {
  const unMutedUsers = useAppSelector((state) => state.room.unMutedUsers);
  const speakingUsers = useAppSelector((state) => state.room.speakingUsers);
  const forceMutedUsers = useAppSelector((state) => state.room.forceMutedUsers);
  const muteAll = useAppSelector((state) => state.room.muteAll);
  const muteAllExcludedUsers = useAppSelector(
    (state) => state.room.muteAllExcludedUsers,
  );
  const moderatorIds = useAppSelector((state) => state.room.moderatorIds);
  const cameraEnabled = useAppSelector((state) => state.room.cameraEnabled);
  const cameraDisabledMemberIds = useAppSelector(
    (state) => state.room.cameraDisabledMemberIds,
  );
  const cameraAllowedMemberIds = useAppSelector(
    (state) => state.room.cameraAllowedMemberIds,
  );
  useSpeakingEvents(room?.id || "");
  const recentlyJoinedIds = useRecentlyJoined(room?.members ?? []);

  const canUseCamera = (memberId: string) =>
    cameraEnabled ||
    cameraAllowedMemberIds.includes(memberId) ||
    (memberId === currentUserId && (currentUserIsHost || currentUserIsModerator));

  if (!room || !isJoined) return null;
  const currentRoom = room;

  if (currentRoom.members.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex max-w-xs flex-col items-center gap-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
            <Users size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Waiting for participants</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Share the room link to invite others to join the conversation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Room link copied!");
            }}
            className="flex items-center gap-2 rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
          >
            <Copy size={14} /> Copy invite link
          </button>
        </div>
      </div>
    );
  }

  const renderMember = (member: Member) => (
    <RoomParticipant
      key={member.id}
      member={member}
      hostId={currentRoom.hostId}
      speakingUsers={speakingUsers}
      unMutedUsers={unMutedUsers}
      forceMutedUsers={forceMutedUsers}
      muteAll={muteAll}
      muteAllExcludedUsers={muteAllExcludedUsers}
      currentUserIsHost={currentUserIsHost}
      currentUserIsModerator={currentUserIsModerator}
      moderatorIds={moderatorIds}
      currentUserId={currentUserId}
      videoStream={
        member.id === currentUserId
          ? localVideoStream
          : (remoteVideoStreams[member.id] ?? null)
      }
      screenShareStream={screenShareStreams[member.id] ?? null}
      onSelectScreenShare={onSelectScreenShare}
      onSelectCamera={onSelectCamera}
      compact={compact}
      isDebateRoom={currentRoom.type === "debate"}
      cameraEnabled={canUseCamera(member.id)}
      cameraDisabled={cameraDisabledMemberIds.includes(member.id)}
      onToggleMemberCamera={(enabled) =>
        roomSocketManager.emit("moderator-set-member-camera", {
          roomId: currentRoom.id,
          targetUserId: member.id,
          cameraEnabled: enabled,
        })
      }
      isVideoEnabled={isVideoEnabled}
      onStartVideo={startVideo}
      onStopVideo={stopVideo}
      recentlyJoinedIds={recentlyJoinedIds}
    />
  );

  const isDebate = currentRoom.type === "debate";
  const forMembers = currentRoom.members.filter((m) => m.side === "for");
  const againstMembers = currentRoom.members.filter((m) => m.side === "against");
  const unassigned = currentRoom.members.filter(
    (m) => m.side !== "for" && m.side !== "against",
  );

  if (compact) {
    const ordered = isDebate
      ? [...forMembers, ...againstMembers, ...unassigned]
      : currentRoom.members;
    return (
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="mx-auto flex h-full w-max gap-3">
          {ordered.map(renderMember)}
        </div>
      </div>
    );
  }

  if (isDebate) {
    return (
      <div className="px-3 pb-6 pt-4 sm:px-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <SideGroup
            title="For"
            tone="for"
            members={forMembers}
            emptyText="No one has taken this side yet."
            render={renderMember}
          />
          <SideGroup
            title="Against"
            tone="against"
            members={againstMembers}
            emptyText="No one has taken this side yet."
            render={renderMember}
          />
          {unassigned.length > 0 && (
            <SideGroup
              title="No position yet"
              tone="none"
              members={unassigned}
              emptyText=""
              render={renderMember}
              className="lg:col-span-2"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-3 pb-6 pt-4 sm:px-4">
      <div className="flex flex-wrap justify-center gap-3">
        {currentRoom.members.map((member) => (
          <div
            key={member.id}
            className="min-w-0 max-w-[240px] flex-[1_1_200px]"
          >
            {renderMember(member)}
          </div>
        ))}
      </div>
    </div>
  );
}