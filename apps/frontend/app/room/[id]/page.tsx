"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useGetSingleRoomQuery } from "@/libs/features/room/roomApiSlice";
import { RoomType } from "@/types/room";
import RoomLayout from "@/components/practicezoon/Room/RoomLayout";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import RoomDetailsModal from "@/components/practicezoon/Room/RoomDetailsModal";
import { roomSocketManager } from "@/libs/socket/index";
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
  const locallyDisconnectedMember = useRef<
    RoomType["members"][number] | null
  >(null);

  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : (id ?? "");
  const { data, isSuccess, refetch } = useGetSingleRoomQuery(roomId, {
    refetchOnMountOrArgChange: true,
  });
  const currentUser = useAppSelector((state) => state.auth.user);
  const moderatorIds = useAppSelector((state) => state.room.moderatorIds);
  const dispatch = useAppDispatch();

  const handleUserJoined = useCallback(
    ({ user }: { user: { id: string; name: string } }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.members.some((m) => m.id === user.id)) return prev;
        return { ...prev, members: [...prev.members, user] };
      });
    },
    [],
  );

  const handleUserLeft = useCallback(
    ({ memberId }: { memberId: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => m.id !== memberId),
        };
      });
    },
    [],
  );

  const handleLocalDisconnect = useCallback(() => {
    if (!currentUser?.id) return;
    setRoom((prev) => {
      if (!prev) return prev;
      const member = prev.members.find(
        (candidate) => candidate.id === currentUser.id,
      );
      if (!member) return prev;
      locallyDisconnectedMember.current = member;
      return {
        ...prev,
        members: prev.members.filter((member) => member.id !== currentUser.id),
      };
    });
  }, [currentUser?.id]);

  const handleLocalReconnect = useCallback(() => {
    const member = locallyDisconnectedMember.current;
    if (!member) return;
    setRoom((prev) => {
      if (
        !prev ||
        prev.members.some((current) => current.id === member.id)
      ) {
        return prev;
      }
      return { ...prev, members: [...prev.members, member] };
    });
    locallyDisconnectedMember.current = null;
  }, []);

  const handleLocalLeave = useCallback((memberId: string) => {
    locallyDisconnectedMember.current = null;
    setRoom((prev) => {
      if (!prev || !prev.members.some((member) => member.id === memberId)) {
        return prev;
      }
      return {
        ...prev,
        members: prev.members.filter((member) => member.id !== memberId),
      };
    });
  }, []);

  const handleKicked = useCallback(() => {
    setIsJoined(false);
    setShowRoomKickedModal(true);
  }, []);

  const {
    joinRoom,
    leaveRoom,
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
    closeMediaView,
    // isScreenSharing,
  } = useRoomSocket({
    roomId,
    currentUserId: currentUser?.id,
    isPrivileged: Boolean(
      currentUser &&
      (currentUser.id === room?.hostId || moderatorIds.includes(currentUser.id)),
    ),
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onLocalLeave: handleLocalLeave,
    onLocalDisconnect: handleLocalDisconnect,
    onLocalReconnect: handleLocalReconnect,
    onKicked: handleKicked,
  });

  const handleLeaveRoom = useCallback(async () => {
    try {
      await leaveRoom();
      setIsJoined(false);
      setShowRoomEndedModal(false);
      setShowRoomKickedModal(false);
    } catch {
      // The hook reports the leave failure and keeps the participant on the room page.
    }
  }, [leaveRoom]);

  useEffect(() => {
    if (data && isSuccess && isRoomResponse(data)) setRoom(data.data);
  }, [data, isSuccess]);

  useEffect(() => {
    if (currentUser?.id) void refetch();
  }, [currentUser?.id, refetch]);

  useEffect(() => {
    const unsubscribe = roomSocketManager.on(
      "room-moderator-updated",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          memberId: string;
          isModerator: boolean;
        };

        if (event.roomId !== roomId) return;

        if (event.isModerator) {
          dispatch(addModeratorId(event.memberId));
        } else {
          dispatch(removeModeratorId(event.memberId));
        }
      },
    );

    return unsubscribe;
  }, [roomId, dispatch]);

  useEffect(() => {
    const unsubscribe = roomSocketManager.on(
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

  useEffect(() => {
    const unsubscribeJoined = roomSocketManager.on(
      "room-member-joined",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          newMember: RoomType["members"][number];
        };
        if (event.roomId !== roomId) return;
        setRoom((previous) => {
          if (!previous) return previous;
          const exists = previous.members.some(
            (member) => member.id === event.newMember.id,
          );
          return {
            ...previous,
            members: exists
              ? previous.members.map((member) =>
                member.id === event.newMember.id ? event.newMember : member,
              )
              : [...previous.members, event.newMember],
          };
        });
      },
    );
    const unsubscribeSide = roomSocketManager.on(
      "room-member-side-updated",
      (payload: unknown) => {
        const event = payload as {
          roomId: string;
          memberId: string;
          side: "for" | "against";
        };
        if (event.roomId !== roomId) return;
        setRoom((previous) =>
          previous
            ? {
              ...previous,
              members: previous.members.map((member) =>
                member.id === event.memberId
                  ? { ...member, side: event.side }
                  : member,
              ),
            }
            : previous,
        );
      },
    );
    const unsubscribeRemoved = roomSocketManager.on(
      "room-member-removed",
      (payload: unknown) => {
        const event = payload as { roomId: string; memberId: string };
        if (event.roomId !== roomId) return;
        setRoom((previous) =>
          previous
            ? {
              ...previous,
              members: previous.members.filter(
                (member) => member.id !== event.memberId,
              ),
            }
            : previous,
        );
      },
    );

    return () => {
      unsubscribeJoined();
      unsubscribeSide();
      unsubscribeRemoved();
    };
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = roomSocketManager.on(
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
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#111111]">
      <BackgroundPattern />

      <RoomDetailsModal
        isOpen={isJoined && !showRoomKickedModal}
        onClose={() => setIsJoined(true)}
        joinRoom={joinRoom}
        onKicked={handleKicked}
      />

      <RoomEndedModal isOpen={showRoomEndedModal} onLeave={handleLeaveRoom} />

      <RoomKickedModal isOpen={showRoomKickedModal} onLeave={handleLeaveRoom} />

      {isJoined && (
        <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
          <RoomLayout
            room={room}
            layout={layout}
            isJoined={isJoined}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            currentUserId={currentUser?.id}
            localVideoStream={localVideoStream}
            remoteVideoStreams={remoteVideoStreams}
            screenShareStreams={screenShareStreams}
            selectedScreenShareOwnerId={selectedScreenShareOwnerId}
            selectedCameraOwnerId={selectedCameraOwnerId}
            isVideoEnabled={isVideoEnabled}
            startVideo={startVideo}
            stopVideo={stopVideo}
            startScreenShare={startScreenShare}
            stopScreenShare={stopScreenShare}
            onLeaveRoom={() => {
              void handleLeaveRoom();
            }}
            selectScreenShare={selectScreenShare}
            selectCamera={selectCamera}
            closeMediaView={closeMediaView}
          />
        </div>
      )}
    </div>
  );
}