// components/practicezoon/Room/RoomLayout.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROOM LAYOUT — UPDATED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Changes:
//   • Derives currentUserIsHost from store and passes to all children
//   • Passes speakingUsers + unMutedUsers to SidePanel (for Participants tab)
//   • Passes raisedHandCount to ControlsBar (for host panel badge)
//   • No business logic changes — purely wiring role-aware props

import React, { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { RoomType } from "@/types/room";
import TopBar from "./TopBar";
import RoomGrid from "./RoomGrid";
import ControlsBar from "./ControlsBar";
import SidePanel from "./SidePanel";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { setUnMutedUser, removeUnMutedUser } from "@/libs/features/room/roomSlice";

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
  const { on } = useSocket();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { unMutedUsers, speakingUsers } = useAppSelector((state) => state.room);

  // Derive host status from room data + current user
  const currentUserIsHost = Boolean(room && currentUser && room.hostId === currentUser.id);

  // For this demo, moderators aren't stored in room state yet.
  // Wire this to real data when moderator roles are implemented.
  const currentUserIsModerator = false;

  // Placeholder — wire to real raise-hand state when implemented
  const raisedHandCount = 0;

  useEffect(() => {
    const unsubMuted = on("user-mute-status", (payload: unknown) => {
      const data = payload as { roomId: string; userId: string; isUnMuted: boolean };
      if (data.isUnMuted) {
        dispatch(setUnMutedUser(data.userId));
      } else {
        dispatch(removeUnMutedUser(data.userId));
      }
    });
    return () => unsubMuted();
  }, [on, dispatch]);

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