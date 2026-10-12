"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCw, SearchX, Loader } from "lucide-react";
import { RoomCard } from "./RoomCard";
import RoomCardSkeleton from "../common/Room/RoomCardSkeleton";
import Bone from "../common/Room/Bone";
import { RoomType } from "@/types/room";
import { useGetRoomsQuery } from "@/libs/features/room/roomApiSlice";
import { publicSocketManager } from "@/libs/socket/index";
import { isRoomsResponse } from "@/utils/typeGuardsForRoom";
import EmptyRoomCard from "../common/EmptyRoomCard";
import { useAppSelector } from "@/libs/hooks";


export default function RoomCardList() {
  const {
    data: initialRooms,
    isFetching,
    isError,
    refetch,
  } = useGetRoomsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [rooms, setRooms] = useState<RoomType[] | null>(() =>
    initialRooms && isRoomsResponse(initialRooms) ? initialRooms.data : null,
  );
  const [revealed, setRevealed] = useState(false);
  const searchKeywords = useAppSelector((state) => state.filter.searchKeywords);

  const isInvalidResponse =
    initialRooms !== undefined && !isRoomsResponse(initialRooms);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];

    const keywords = searchKeywords
      .map((keyword) => keyword.trim().toLowerCase())
      .filter(Boolean);

    if (keywords.length === 0) return rooms;

    return rooms.filter((room) => {
      const searchableValues = [
        room.id,
        room.title,
        room.language,
        room.level,
        ...room.members.flatMap((member) => [member.id, member.name]),
      ].map((value) => String(value ?? "").toLowerCase());

      return keywords.some((keyword) =>
        searchableValues.some((value) => value.includes(keyword)),
      );
    });
  }, [rooms, searchKeywords]);

  useEffect(() => {
    if (initialRooms && isRoomsResponse(initialRooms)) {
      setRooms(initialRooms.data);
    }
  }, [initialRooms]);

  const hasRooms = rooms !== null;
  useEffect(() => {
    if (!hasRooms) return;
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, [hasRooms]);

  useEffect(() => {
    const unsubscribe = publicSocketManager.on(
      "public-room-ended",
      (payload: unknown) => {
        const { roomId } = payload as { roomId: string };

        setRooms((prev) =>
          prev
            ? prev.map((room) =>
              room.id === roomId ? { ...room, status: "ended" } : room,
            )
            : prev,
        );
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubCreated = publicSocketManager.on(
      "public-room-created",
      (payload) => {
        const room = payload as RoomType;
        setRooms((prev) => {
          if (!prev) return prev;
          if (prev.some((r) => r.id === room.id)) return prev;
          return [room, ...prev];
        });
      },
    );

    const unsubJoined = publicSocketManager.on(
      "public-room-member-joined",
      (payload: unknown) => {
        const data = payload as {
          roomId: string;
          newMember: RoomType["members"][number];
        };
        setRooms((prev) =>
          prev
            ? prev.map((room) => {
              if (room.id !== data.roomId) return room;
              const exists = room.members.some(
                (m) => m.id === data.newMember.id,
              );
              if (exists) return room;
              return { ...room, members: [...room.members, data.newMember] };
            })
            : prev,
        );
      },
    );

    const unsubLeft = publicSocketManager.on(
      "public-room-member-removed",
      (payload: unknown) => {
        const data = payload as { roomId: string; memberId: string };
        setRooms((prev) =>
          prev
            ? prev.map((room) => {
              if (room.id !== data.roomId) return room;
              return {
                ...room,
                members: room.members.filter((m) => m.id !== data.memberId),
              };
            })
            : prev,
        );
      },
    );

    return () => {
      unsubCreated();
      unsubJoined();
      unsubLeft();
    };
  }, []);

  if (rooms === null || isFetching) {
    if (isError || isInvalidResponse) {
      return (
        <div
          role="alert"
          className="mt-8 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161616] px-6 text-center md:mt-10"
        >
          <AlertTriangle size={20} className="text-gray-500" />
          <h2 className="mt-3 text-base font-semibold text-white">
            Couldn’t load rooms
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-gray-500">
            Something went wrong while fetching rooms. Check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw
              size={14}
              className={isFetching ? "animate-spin motion-reduce:animate-none" : ""}
            />
            {isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      );
    }

    return (
      <div className="mt-8 md:mt-10" role="status" aria-live="polite">
        <span className="sr-only">Loading rooms…</span>
        <div className="mb-5 flex items-center justify-between gap-3" aria-hidden="true">
          <Bone className="h-4 w-28" />
          <Bone className="h-4 w-14 bg-white/[0.04]" />
        </div>
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          aria-hidden="true"
        >
          {Array.from({ length: rooms?.length || 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (rooms.length === 0 && !isFetching) return <EmptyRoomCard />;

  if (filteredRooms.length === 0) {
    return (
      <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161616] px-6 text-center md:mt-10">
        <SearchX size={20} className="text-gray-500" />
        <h2 className="mt-3 text-base font-semibold text-white">
          No matching rooms
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Try another keyword or remove a search filter.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 md:mt-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-white">
          Available rooms
        </h2>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          {isFetching && (
            <Loader
              size={13}
              className="animate-spin motion-reduce:animate-none"
            />
          )}

          {filteredRooms.length > 0 && (
            <span className="rounded-md border border-white/[0.07] bg-[#161616] px-2 py-1 font-medium tabular-nums">
              {filteredRooms.length}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room, index) => (
          <div
            key={room.id}
            className="transition-all duration-500 motion-reduce:transition-none"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(16px)",
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