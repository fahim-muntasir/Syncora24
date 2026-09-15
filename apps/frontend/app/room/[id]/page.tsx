"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetSingleRoomQuery } from "@/libs/features/room/roomApiSlice";
import { RoomType } from "@/types/room";
import RoomLayout from "@/components/practicezoon/Room/RoomLayout";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import RoomDetailsModal from "@/components/practicezoon/Room/RoomDetailsModal";
import { socketManager } from "@/libs/socket/index";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import {
  addModeratorId,
  removeModeratorId,
  setModeratorIds,
  setKickedMemberIds,
} from "@/libs/features/room/roomSlice";
import { isRoomResponse } from "@/utils/typeGuardsForRoom";
import RoomEndedModal from "@/components/practicezoon/Room/Modals/RoomEndedModal";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import RoomKickedModal from "@/components/practicezoon/Room/Modals/RoomKickedModal";

export default function VideoConference() {
  const [room, setRoom] = useState<RoomType | null>(null);
  const [layout] = useState<"grid" | "spotlight">("grid");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showRoomEndedModal, setShowRoomEndedModal] = useState(false);
  const [showRoomKickedModal, setShowRoomKickedModal] = useState(false);

  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : (id ?? "");
  const { data, isSuccess } = useGetSingleRoomQuery(roomId, {
    refetchOnMountOrArgChange: true,
  });
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

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

  const handleKicked = () => {
    setIsJoined(false);
    setShowRoomKickedModal(true);
  };

  const { joinRoom, leaveRoom } = useRoomSocket({
    roomId,
    currentUserId: currentUser?.id,
    currentUserName: currentUser?.fullName,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onKicked: handleKicked,
  });

  useEffect(() => {
    if (data && isSuccess && isRoomResponse(data)) setRoom(data.data);
  }, [data, isSuccess]);

  useEffect(() => {
    const unsubscribe = socketManager.on(
      "room-moderator-updated",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          memberId: string;
          isModerator: boolean;
        };

        if (event.roomId !== roomId) return;

        setRoom((previousRoom) => {
          if (!previousRoom) return previousRoom;

          if (event.isModerator) {
            dispatch(addModeratorId(event.memberId));
          } else {
            dispatch(removeModeratorId(event.memberId));
          }

          return previousRoom;
        });
      },
    );

    return unsubscribe;
  }, [roomId, dispatch]);

  useEffect(() => {
    const unsubscribe = socketManager.on(
      "room-moderator-state",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          moderatorIds: string[];
          kickedMemberIds: string[];
        };

        if (event.roomId !== roomId) return;

        dispatch(setModeratorIds(event.moderatorIds ?? []));
        dispatch(setKickedMemberIds(event.kickedMemberIds ?? []));
      },
    );

    return unsubscribe;
  }, [roomId, dispatch]);

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
        isOpen={isJoined && !showRoomKickedModal}
        onClose={() => setIsJoined(true)}
        joinRoom={joinRoom}
        onKicked={handleKicked}
      />

      <RoomEndedModal
        isOpen={showRoomEndedModal}
        onLeave={() => {
          leaveRoom();
          window.location.replace("/");
        }}
      />

      <RoomKickedModal
        isOpen={showRoomKickedModal}
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