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
import RoomEndedModal from "@/components/practicezoon/Room/Modals/RoomEndedModal";
import { useRoomSocket } from "@/hooks/useRoomSocket";

export default function VideoConference() {
  const [room, setRoom] = useState<RoomType | null>(null);
  const [layout] = useState<"grid" | "spotlight">("grid");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showRoomEndedModal, setShowRoomEndedModal] = useState(false);

  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : (id ?? "");
  const { data, isSuccess } = useGetSingleRoomQuery(roomId, {
    refetchOnMountOrArgChange: true,
  });
  const currentUser = useAppSelector((state) => state.auth.user);

  const handleUserJoined = ({ user }: { user: { id: string; name: string } }) => {
    setRoom((prev) => {
      if (!prev) return prev;
      if (prev.members.some((m) => m.id === user.id)) return prev;
      return { ...prev, members: [...prev.members, user] };
    });
  };

  const handleUserLeft = ({ memberId }: { memberId: string }) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return { ...prev, members: prev.members.filter((m) => m.id !== memberId) };
    });
  };

  const { joinRoom, leaveRoom } = useRoomSocket({
    roomId,
    currentUserId: currentUser?.id,
    currentUserName: currentUser?.fullName,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
  });

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

  useEffect(() => {
    const unsubscribe = socketManager.on(
      "room-ended-for-members",
      (payload: unknown) => {
        const { roomId: endedRoomId } = payload as {
          roomId: string;
          endedBy: string;
        };

        if (endedRoomId !== roomId) {
          return;
        }

        setShowRoomEndedModal(true);
      }
    );

    return unsubscribe;
  }, [roomId]);

  return (
    <div className="flex flex-col min-h-screen relative bg-[#0e0e0e] overflow-hidden">
      <BackgroundPattern />

      <RoomDetailsModal
        isOpen={isJoined}
        onClose={() => setIsJoined(true)}
        joinRoom={joinRoom}
      />

      <RoomEndedModal
        isOpen={showRoomEndedModal}
        onLeave={() => {
          leaveRoom();
          window.location.replace("/");
        }}
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