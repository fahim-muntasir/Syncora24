import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RoomType } from "@/types/room";
import TopBar from "./TopBar";
import RoomGrid from "./RoomGrid";
import RoomOverview from "./RoomOverview";
import ControlsBar from "./ControlsBar";
import SidePanel from "./SidePanel";
import StreamVideo from "./StreamVideo";
import { useAppSelector } from "@/libs/hooks";

function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      className={`${className} transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"
        }`}
    >
      {children}
    </div>
  );
}

function StagePanel({
  stream,
  muted,
  label,
}: {
  stream: MediaStream;
  muted: boolean;
  label: string;
}) {
  return (
    <div className="relative min-h-[200px] min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black">
      <StreamVideo
        stream={stream}
        muted={muted}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
      <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white/90">
        {label}
      </span>
    </div>
  );
}

export default function RoomLayout({
  room,
  isJoined,
  sidebarCollapsed,
  setSidebarCollapsed,
  currentUserId,
  localVideoStream,
  remoteVideoStreams,
  screenShareStreams,
  selectedScreenShareOwnerId,
  selectedCameraOwnerId,
  isVideoEnabled,
  startVideo,
  stopVideo,
  startScreenShare,
  stopScreenShare,
  onLeaveRoom,
  selectScreenShare,
  selectCamera,
}: {
  room: RoomType | null;
  layout: "grid" | "spotlight";
  isJoined: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentUserId?: string;
  localVideoStream: MediaStream | null;
  remoteVideoStreams: Record<string, MediaStream>;
  screenShareStreams: Record<string, MediaStream>;
  selectedScreenShareOwnerId: string | null;
  selectedCameraOwnerId: string | null;
  isVideoEnabled: boolean;
  startVideo: () => Promise<void>;
  stopVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  onLeaveRoom: () => void;
  selectScreenShare: (userId: string) => void;
  selectCamera: (userId: string) => void;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const unMutedUsers = useAppSelector((state) => state.room.unMutedUsers);
  const speakingUsers = useAppSelector((state) => state.room.speakingUsers);
  const moderatorIds = useAppSelector((state) => state.room.moderatorIds);
  const cameraEnabled = useAppSelector((state) => state.room.cameraEnabled);
  const cameraAllowedMemberIds = useAppSelector(
    (state) => state.room.cameraAllowedMemberIds,
  );

  const [view, setView] = useState<"overview" | "stage">("overview");

  const currentUserIsHost = Boolean(room && currentUser && room.hostId === currentUser.id);
  const currentUserIsModerator = Boolean(
    room && currentUser && moderatorIds.includes(currentUser.id),
  );

  const selectedScreenShareStream = selectedScreenShareOwnerId
    ? (screenShareStreams[selectedScreenShareOwnerId] ?? null)
    : null;
  const selectedCameraStream = selectedCameraOwnerId
    ? selectedCameraOwnerId === currentUserId
      ? localVideoStream
      : (remoteVideoStreams[selectedCameraOwnerId] ?? null)
    : null;

  const hasStage = Boolean(selectedScreenShareStream || selectedCameraStream);
  const showStage = view === "stage" && hasStage;

  useEffect(() => {
    if (selectedScreenShareOwnerId || selectedCameraOwnerId) setView("stage");
  }, [selectedScreenShareOwnerId, selectedCameraOwnerId]);

  useEffect(() => {
    if (!showStage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [role="menu"]')) return;
      setView("overview");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showStage]);

  const handleSelectCamera = useCallback(
    (userId: string) => {
      selectCamera(userId);
      setView("stage");
    },
    [selectCamera],
  );

  const handleSelectScreenShare = useCallback(
    (userId: string) => {
      selectScreenShare(userId);
      setView("stage");
    },
    [selectScreenShare],
  );

  const nameOf = (userId: string | null) =>
    room?.members.find((member) => member.id === userId)?.name ?? "Participant";

  const cameraCount =
    (localVideoStream ? 1 : 0) + Object.keys(remoteVideoStreams).length;
  const screenCount = Object.keys(screenShareStreams).length;

  const gridProps = {
    room,
    isJoined,
    currentUserIsHost,
    currentUserIsModerator,
    currentUserId,
    localVideoStream,
    remoteVideoStreams,
    screenShareStreams,
    onSelectScreenShare: handleSelectScreenShare,
    onSelectCamera: handleSelectCamera,
    isVideoEnabled,
    startVideo,
    stopVideo,
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          room={room}
          currentUserIsHost={currentUserIsHost}
          currentUserIsModerator={currentUserIsModerator}
        />

        {showStage ? (
          <FadeIn key="stage" className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2 sm:px-4">
              <button
                type="button"
                onClick={() => setView("overview")}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
              >
                <ArrowLeft size={14} />
                Room overview
              </button>
              <span className="hidden text-xs text-gray-600 sm:block">
                Press Esc to go back
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
              <div
                className={`grid min-h-0 flex-1 gap-3 ${selectedScreenShareStream && selectedCameraStream
                    ? "grid-rows-[minmax(0,1fr)_minmax(0,0.45fr)] lg:grid-cols-[minmax(0,1fr)_minmax(200px,0.3fr)] lg:grid-rows-none"
                    : ""
                  }`}
              >
                {selectedScreenShareStream && (
                  <StagePanel
                    stream={selectedScreenShareStream}
                    muted={selectedScreenShareOwnerId === currentUserId}
                    label={
                      selectedScreenShareOwnerId === currentUserId
                        ? "Your screen"
                        : `${nameOf(selectedScreenShareOwnerId)} · Screen`
                    }
                  />
                )}
                {selectedCameraStream && (
                  <StagePanel
                    stream={selectedCameraStream}
                    muted={selectedCameraOwnerId === currentUserId}
                    label={
                      selectedCameraOwnerId === currentUserId
                        ? "Your camera"
                        : `${nameOf(selectedCameraOwnerId)} · Camera`
                    }
                  />
                )}
              </div>

              <div className="h-[132px] shrink-0 sm:h-[130px]">
                <RoomGrid {...gridProps} compact />
              </div>
            </div>
          </FadeIn>
        ) : (
          <FadeIn
            key="overview"
            className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto"
          >
            <RoomOverview
              room={room}
              cameraCount={cameraCount}
              screenCount={screenCount}
            />

            <RoomGrid {...gridProps} />
          </FadeIn>
        )}

        <ControlsBar
          canUseCamera={
            cameraEnabled ||
            currentUserIsHost ||
            currentUserIsModerator ||
            Boolean(currentUserId && cameraAllowedMemberIds.includes(currentUserId))
          }
          isVideoEnabled={isVideoEnabled}
          onStartVideo={startVideo}
          onStopVideo={stopVideo}
          isScreenSharing={Boolean(currentUserId && screenShareStreams[currentUserId])}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
          onLeaveRoom={onLeaveRoom}
        />
      </div>

      <SidePanel
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        room={room}
        speakingUsers={speakingUsers}
        unMutedUsers={unMutedUsers}
        currentUserIsHost={currentUserIsHost}
        currentUserIsModerator={currentUserIsModerator}
      />
    </div>
  );
}