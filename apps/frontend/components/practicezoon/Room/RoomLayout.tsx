import React from "react";
import { RoomType } from "@/types/room";
import TopBar from "./TopBar";
import RoomGrid from "./RoomGrid";
import ControlsBar from "./ControlsBar";
import SidePanel from "./SidePanel";
import StreamVideo from "./StreamVideo";
import { useAppSelector } from "@/libs/hooks";
import { roomSocketManager } from "@/libs/socket";

export default function RoomLayout({
  room,
  layout,
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
  selectScreenShare,
  selectCamera,
  // isScreenSharing,
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
  selectScreenShare: (userId: string) => void;
  selectCamera: (userId: string) => void;
  // isScreenSharing: boolean;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  // const {
  //   unMutedUsers,
  //   speakingUsers,
  //   moderatorIds,
  //   cameraEnabled,
  //   cameraAllowedMemberIds,
  // } = useAppSelector((state) => state.room);
  const unMutedUsers = useAppSelector((state) => state.room.unMutedUsers);
  const speakingUsers = useAppSelector((state) => state.room.speakingUsers);
  const moderatorIds = useAppSelector((state) => state.room.moderatorIds);
  const cameraEnabled = useAppSelector((state) => state.room.cameraEnabled);
  const cameraAllowedMemberIds = useAppSelector(
    (state) => state.room.cameraAllowedMemberIds,
  );
  const currentUserIsHost = Boolean(room && currentUser && room.hostId === currentUser.id);
  const currentUserIsModerator = Boolean(
    room && currentUser && moderatorIds.includes(currentUser.id),
  );
  const raisedHandCount = 0;
  const selectedScreenShareStream = selectedScreenShareOwnerId
    ? screenShareStreams[selectedScreenShareOwnerId] ?? null
    : null;
  const selectedCameraStream = selectedCameraOwnerId
    ? selectedCameraOwnerId === currentUserId
      ? localVideoStream
      : remoteVideoStreams[selectedCameraOwnerId] ?? null
    : null;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <TopBar
          room={room}
          currentUserIsHost={currentUserIsHost}
          currentUserIsModerator={currentUserIsModerator}
        />
        {selectedScreenShareStream ? (
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full flex flex-col gap-3">
              <div className={`flex-1 min-h-[280px] grid gap-3 ${
                selectedCameraStream ? "grid-cols-[minmax(0,1fr)_minmax(180px,0.28fr)]" : ""
              }`}>
                <div className="relative min-w-0 rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
                  {/* <video
                    autoPlay
                    muted={selectedScreenShareOwnerId === currentUserId}
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    ref={(element) => {
                      if (element) element.srcObject = selectedScreenShareStream;
                    }}
                  /> */}
                  <StreamVideo
                    stream={selectedScreenShareStream}
                    muted={selectedScreenShareOwnerId === currentUserId}
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                  />
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/[0.1] bg-black/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                    {selectedScreenShareOwnerId === currentUserId ? "Your screen" : "Screen share"}
                  </div>
                </div>
                {selectedCameraStream && (
                  <div className="relative min-w-0 rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
                    {/* <video
                      autoPlay
                      muted={selectedCameraOwnerId === currentUserId}
                      playsInline
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                      ref={(element) => {
                        if (element) element.srcObject = selectedCameraStream;
                      }}
                    /> */}
                    <StreamVideo
                      stream={selectedCameraStream}
                      muted={selectedCameraOwnerId === currentUserId}
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                    />
                    <div className="absolute bottom-3 left-3 rounded-full border border-white/[0.1] bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm">
                      Camera
                    </div>
                  </div>
                )}
              </div>
              <div className="h-[150px] overflow-hidden">
                <RoomGrid
                  layout={layout}
                  room={room}
                  isJoined={isJoined}
                  currentUserIsHost={currentUserIsHost}
                  currentUserIsModerator={currentUserIsModerator}
                  currentUserId={currentUserId}
                  localVideoStream={localVideoStream}
                  remoteVideoStreams={remoteVideoStreams}
                  screenShareStreams={screenShareStreams}
                  onSelectScreenShare={selectScreenShare}
                  onSelectCamera={selectCamera}
                  compact
                  isVideoEnabled={isVideoEnabled}
                  startVideo={startVideo}
                  stopVideo={stopVideo}
                />
              </div>
            </div>
          </div>
        ) : selectedCameraStream ? (
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full flex flex-col gap-3">
              <div className="relative flex-1 min-h-[280px] rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
                {/* <video
                  autoPlay
                  muted={selectedCameraOwnerId === currentUserId}
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  ref={(element) => {
                    if (element) element.srcObject = selectedCameraStream;
                  }}
                /> */}
                <StreamVideo
                  stream={selectedCameraStream}
                  muted={selectedCameraOwnerId === currentUserId}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
                <div className="absolute bottom-3 left-3 rounded-full border border-white/[0.1] bg-black/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                  Camera
                </div>
              </div>
              <div className="h-[150px] overflow-hidden">
                <RoomGrid
                  layout={layout}
                  room={room}
                  isJoined={isJoined}
                  currentUserIsHost={currentUserIsHost}
                  currentUserIsModerator={currentUserIsModerator}
                  currentUserId={currentUserId}
                  localVideoStream={localVideoStream}
                  remoteVideoStreams={remoteVideoStreams}
                  screenShareStreams={screenShareStreams}
                  onSelectScreenShare={selectScreenShare}
                  onSelectCamera={selectCamera}
                  compact
                  isVideoEnabled={isVideoEnabled}
                  startVideo={startVideo}
                  stopVideo={stopVideo}
                />
              </div>
            </div>
          </div>
        ) : (
          <RoomGrid
            layout={layout}
            room={room}
            isJoined={isJoined}
            currentUserIsHost={currentUserIsHost}
            currentUserIsModerator={currentUserIsModerator}
            currentUserId={currentUserId}
            localVideoStream={localVideoStream}
            remoteVideoStreams={remoteVideoStreams}
            screenShareStreams={screenShareStreams}
            onSelectScreenShare={selectScreenShare}
            onSelectCamera={selectCamera}
            isVideoEnabled={isVideoEnabled}
            startVideo={startVideo}
            stopVideo={stopVideo}
          />
        )}
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
            roomSocketManager.emit("moderator-set-camera", {
              roomId: room?.id,
              cameraEnabled: !cameraEnabled,
            })
          }
          isVideoEnabled={isVideoEnabled}
          onStartVideo={startVideo}
          onStopVideo={stopVideo}
          isScreenSharing={Boolean(currentUserId && screenShareStreams[currentUserId])}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
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