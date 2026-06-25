// app/practicezoon/[id]/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetSingleRoomQuery } from "@/libs/features/room/roomApiSlice";
import { RoomType } from "@/types/room";
import RoomLayout from "@/components/practicezoon/Room/RoomLayout";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import RoomDetailsModal from "@/components/practicezoon/Room/RoomDetailsModal";
import { socketManager } from "@/libs/socket/index";
import { useAppSelector } from "@/libs/hooks";
import { isRoomResponse } from "@/utils/typeGuardsForRoom";

export default function VideoConference() {
  const [room, setRoom] = useState<RoomType | null>(null);
  const [layout] = useState<"grid" | "spotlight">("grid");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : (id ?? "");
  const { data, isSuccess, refetch } = useGetSingleRoomQuery(roomId, {
    refetchOnMountOrArgChange: true,
  });
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (data && isSuccess && isRoomResponse(data)) setRoom(data.data);
  }, [data, isSuccess]);

  // Emit leave on tab/window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      socketManager.emit("leave-room", { roomId, memberId: currentUser?.id });
    };
    const inRoom = room?.members.some((m) => m.id === currentUser?.id);
    if (inRoom) window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [room, currentUser, roomId]);

  const handleUserJoined = ({ user }: { user: { id: string; name: string } }) => {
    setRoom((prev) => {
      if (!prev) return prev;
      if (prev.members.some((m) => m.id === user.id)) return prev;
      return { ...prev, members: [...prev.members, user] };
    });
    refetch();
  };

  const handleUserLeft = ({ memberId }: { memberId: string }) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return { ...prev, members: prev.members.filter((m) => m.id !== memberId) };
    });
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-[#0e0e0e] overflow-hidden">
      <BackgroundPattern />

      {/* Join gate modal */}
      <RoomDetailsModal
        isOpen={isJoined}
        onClose={() => setIsJoined(true)}
        handleUserJoined={handleUserJoined}
        handleUserLeft={handleUserLeft}
      />

      {/* Room layout */}
      {isJoined && (
        <div className="relative z-10 flex flex-1 min-h-screen overflow-hidden">
          <RoomLayout
            room={room}
            layout={layout}
            isJoined={isJoined}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />
        </div>
      )}
    </div>
  );
}