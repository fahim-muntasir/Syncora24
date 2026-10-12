import React from "react";
import { Crown, Globe2, ShieldCheck, Users } from "lucide-react";
import { RoomType } from "@/types/room";
import LevelMeter from "./LevelMeter";

interface TopBarProps {
  room: RoomType | null;
  currentUserIsHost?: boolean;
  currentUserIsModerator?: boolean;
}

export default function TopBar({
  room,
  currentUserIsHost = false,
  currentUserIsModerator = false,
}: TopBarProps) {
  const isUnlimited =
    room && (room.maxParticipants === 0 || room.maxParticipants === Infinity);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#111111] px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">

        {room && (
          <div className="hidden items-center gap-3 text-xs text-gray-400 md:flex">
            <LevelMeter level={room.level} />
            <span className="flex items-center gap-1.5">
              <Globe2 size={12} className="text-gray-500" />
              {room.language}
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Users size={12} className="text-gray-500" />
              {room.members.length}/{isUnlimited ? "∞" : room.maxParticipants}
            </span>
          </div>
        )}
      </div>

      {(currentUserIsHost || currentUserIsModerator) && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
          {currentUserIsHost ? (
            <Crown size={13} className="text-amber-400" />
          ) : (
            <ShieldCheck size={13} className="text-blue-400" />
          )}
          <span className="hidden sm:inline">
            {currentUserIsHost ? "You’re the host" : "You’re a moderator"}
          </span>
        </span>
      )}
    </header>
  );
}