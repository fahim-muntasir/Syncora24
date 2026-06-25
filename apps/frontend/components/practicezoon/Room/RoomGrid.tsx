import React, { useEffect, useState } from "react";
import RoomParticipant from "./RoomParticipant";
import { RoomType } from "@/types/room";
import { useAppSelector } from "@/libs/hooks";
import { useSpeakingEvents } from "@/hooks/useSpeakingEvents";
import { Users, Copy } from "lucide-react";
import toast from "react-hot-toast";

// Track recently joined members (joined within last 60s)
function useRecentlyJoined(members: RoomType["members"]) {
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const prevIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(members.map((m) => m.id));
    const newIds: string[] = [];

    currentIds.forEach((id) => {
      if (!prevIdsRef.current.has(id)) newIds.push(id);
    });

    if (newIds.length > 0) {
      setRecentIds((prev) => new Set([...prev, ...newIds]));

      // Remove "new" badge after 60 seconds
      const timeout = setTimeout(() => {
        setRecentIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 60_000);

      prevIdsRef.current = currentIds;
      return () => clearTimeout(timeout);
    }

    prevIdsRef.current = currentIds;
  }, [members]);

  return [...recentIds];
}

// Responsive grid class based on member count
function getGridClass(count: number, layout: string): string {
  if (layout === "spotlight") return "grid-cols-1 lg:grid-cols-[2fr_1fr]";
  if (count === 1) return "grid-cols-1 max-w-lg mx-auto";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-3";
  if (count <= 4) return "grid-cols-2 sm:grid-cols-2";
  if (count <= 6) return "grid-cols-2 sm:grid-cols-3";
  return "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4";
}

export default function RoomGrid({
  layout,
  room,
  isJoined,
  currentUserIsHost = false,
}: {
  layout: string;
  room: RoomType | null;
  isJoined: boolean;
  currentUserIsHost?: boolean;
}) {
  const { unMutedUsers, speakingUsers } = useAppSelector((state) => state.room);
  useSpeakingEvents(room?.id || "");
  const recentlyJoinedIds = useRecentlyJoined(room?.members ?? []);

  const anySpeaking = speakingUsers.length > 0;

  if (!room || !isJoined) return null;

  if (room.members.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Users size={24} className="text-gray-600" />
          </div>
          <div>
            <p className="text-gray-300 font-semibold text-sm mb-1">Waiting for participants</p>
            <p className="text-gray-600 text-xs leading-relaxed">
              Share the room link to invite others to join the conversation.
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Room link copied!");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/15 transition-all"
          >
            <Copy size={14} /> Copy invite link
          </button>
        </div>
      </div>
    );
  }

  const gridClass = getGridClass(room.members.length, layout);

  return (
    <div className={`flex-1 p-4 overflow-auto min-h-0 relative`}>
      {/* Ambient speaking pulse — subtle edge glow when room is active */}
      {anySpeaking && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] z-0"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(74,222,128,0.4) 0%, transparent 70%)",
          }}
        />
      )}

      <div className={`grid gap-3 h-full relative z-10 ${gridClass} ${room.members.length <= 2 ? "content-center" : "auto-rows-fr"}`}>
        {layout === "spotlight" ? (
          <>
            {/* Featured speaker */}
            <RoomParticipant
              member={room.members[0]}
              isLarge
              hostId={room.hostId}
              speakingUsers={speakingUsers}
              unMutedUsers={unMutedUsers}
              currentUserIsHost={currentUserIsHost}
              recentlyJoinedIds={recentlyJoinedIds}
            />
            {/* Sidebar — "on deck" participants */}
            <div className="grid gap-3 grid-cols-1 auto-rows-fr">
              {room.members.slice(1).map((member) => (
                <RoomParticipant
                  key={member.id}
                  member={member}
                  hostId={room.hostId}
                  speakingUsers={speakingUsers}
                  unMutedUsers={unMutedUsers}
                  currentUserIsHost={currentUserIsHost}
                  recentlyJoinedIds={recentlyJoinedIds}
                />
              ))}
            </div>
          </>
        ) : (
          room.members.map((member) => (
            <RoomParticipant
              key={member.id}
              member={member}
              hostId={room.hostId}
              speakingUsers={speakingUsers}
              unMutedUsers={unMutedUsers}
              currentUserIsHost={currentUserIsHost}
              recentlyJoinedIds={recentlyJoinedIds}
            />
          ))
        )}
      </div>
    </div>
  );
}