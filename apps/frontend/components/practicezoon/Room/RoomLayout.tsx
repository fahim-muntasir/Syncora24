import React from "react";
import { RoomType } from "@/types/room";
import TopBar from "./TopBar";
import RoomGrid from "./RoomGrid";
import ControlsBar from "./ControlsBar";
import SidePanel from "./SidePanel";
import { useAppSelector } from "@/libs/hooks";

export default function RoomLayout({
  room,
  layout,
  isJoined,
  sidebarCollapsed,
  setSidebarCollapsed,
}: {
  room: RoomType | null;
  layout: "grid" | "spotlight";
  isJoined: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { unMutedUsers, speakingUsers } = useAppSelector((state) => state.room);
  const currentUserIsHost = Boolean(room && currentUser && room.hostId === currentUser.id);
  const currentUserIsModerator = false;
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
        />
        <ControlsBar
          currentUserIsHost={currentUserIsHost}
          raisedHandCount={raisedHandCount}
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
      />
    </div>
  );
}