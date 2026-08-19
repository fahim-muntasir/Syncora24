"use client";
import React, { useState, useEffect } from "react";
import { RoomCard } from "./RoomCard";
import { RoomType } from "@/types/room";
import { useGetRoomsQuery } from "@/libs/features/room/roomApiSlice";
import { socketManager } from "@/libs/socket/index";
import { isRoomsResponse } from "@/utils/typeGuardsForRoom";
import EmptyRoomCard from "../common/EmptyRoomCard";

function RoomCardSkeleton() {
  return (
    <div className="bg-[#161616] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <div className="h-6 w-20 rounded-full bg-white/[0.06]" />
            <div className="h-6 w-16 rounded-full bg-white/[0.06]" />
          </div>
          <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-4 w-1/2 rounded bg-white/[0.04] mt-2" />
        </div>
        <div className="h-5 w-12 rounded bg-white/[0.06]" />
      </div>
      <div className="flex gap-2.5 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-12 h-12 rounded-full bg-white/[0.06]" />
        ))}
      </div>
      <div className="flex justify-between pt-3 border-t border-white/[0.06]">
        <div className="h-3 w-16 rounded bg-white/[0.04]" />
        <div className="h-3 w-16 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export default function RoomCardList() {
  const { data: initialRooms, isLoading } = useGetRoomsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialRooms && isRoomsResponse(initialRooms)) {
      setRooms(initialRooms.data);
    }
  }, [initialRooms]);

  useEffect(() => {
    const unsubscribe = socketManager.on(
      "room-ended",
      (payload: unknown) => {
        const { roomId } = payload as {
          roomId: string;
        };

        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === roomId
              ? { ...room, status: "ended" }
              : room
          )
        );
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubCreated = socketManager.on("roomCreated", (payload) => {
      const room = payload as RoomType;
      setRooms((prev) => {
        if (prev.some((r) => r.id === room.id)) return prev;
        return [room, ...prev];
      });
    });

    const unsubJoined = socketManager.on("joinedMember", (payload: unknown) => {
      const data = payload as { roomId: string; newMember: RoomType["members"][number] };
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== data.roomId) return room;
          const exists = room.members.some((m) => m.id === data.newMember.id);
          if (exists) return room;
          return { ...room, members: [...room.members, data.newMember] };
        })
      );
    });

    const unsubLeft = socketManager.on("removedMember", (payload: unknown) => {
      const data = payload as { roomId: string; memberId: string };
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== data.roomId) return room;
          return {
            ...room,
            members: room.members.filter((m) => m.id !== data.memberId),
          };
        })
      );
    });

    return () => {
      unsubCreated();
      unsubJoined();
      unsubLeft();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8">
        {/* Section header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-8 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) return <EmptyRoomCard />;

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-base">Available Rooms</h2>
          <span className="text-xs text-gray-500 bg-white/[0.05] border border-white/[0.07] px-2.5 py-1 rounded-full">
            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
          </span>
        </div>
      </div>

      {/* Card grid with staggered entrance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className="transition-all duration-500"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: `${Math.min(index * 60, 400)}ms`,
            }}
          >
            <RoomCard room={room} />
          </div>
        ))}
      </div>
    </div>
  );
}