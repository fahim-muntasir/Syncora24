import React from "react";
import { RoomType } from "@/types/room";
import TopBar from "./TopBar";
import RoomGrid from "./RoomGrid";
import ControlsBar from "./ControlsBar";
import SidePanel from "./SidePanel";
import { useAppSelector } from "@/libs/hooks";
import { socketManager } from "@/libs/socket";

export default function RoomLayout({
  room,
  layout,
  isJoined,
  sidebarCollapsed,
  setSidebarCollapsed,
  currentUserId,
  localVideoStream,
  remoteVideoStreams,
  isVideoEnabled,
  startVideo,
  stopVideo,
}: {
  room: RoomType | null;
  layout: "grid" | "spotlight";
  isJoined: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentUserId?: string;
  localVideoStream: MediaStream | null;
  remoteVideoStreams: Record<string, MediaStream>;
  isVideoEnabled: boolean;
  startVideo: () => Promise<void>;
  stopVideo: () => void;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const {
    unMutedUsers,
    speakingUsers,
    moderatorIds,
    cameraEnabled,
    cameraAllowedMemberIds,
  } = useAppSelector((state) => state.room);
  const currentUserIsHost = Boolean(room && currentUser && room.hostId === currentUser.id);
  const currentUserIsModerator = Boolean(
    room && currentUser && moderatorIds.includes(currentUser.id),
  );
  const raisedHandCount = 0;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <TopBar
          room={room}
          currentUserIsHost={currentUserIsHost}
          currentUserIsModerator={currentUserIsModerator}
        />
        <RoomGrid
          layout={layout}
          room={room}
          isJoined={isJoined}
          currentUserIsHost={currentUserIsHost}
          currentUserIsModerator={currentUserIsModerator}
          currentUserId={currentUserId}
          localVideoStream={localVideoStream}
          remoteVideoStreams={remoteVideoStreams}
          isVideoEnabled={isVideoEnabled}
          startVideo={startVideo}
          stopVideo={stopVideo}
        />
        <ControlsBar
          currentUserIsHost={currentUserIsHost}
          currentUserIsModerator={currentUserIsModerator}
          raisedHandCount={raisedHandCount}
          cameraEnabled={cameraEnabled}
          canUseCamera={
            cameraEnabled ||
            currentUserIsHost ||
            currentUserIsModerator ||
            Boolean(currentUserId && cameraAllowedMemberIds.includes(currentUserId))
          }
          onToggleCameraAccess={() =>
            socketManager.emit("moderator-set-camera", {
              roomId: room?.id,
              cameraEnabled: !cameraEnabled,
            })
          }
          isVideoEnabled={isVideoEnabled}
          onStartVideo={startVideo}
          onStopVideo={stopVideo}
        />
      </div>

      {/* Side panel */}
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