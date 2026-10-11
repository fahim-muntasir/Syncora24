import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Globe2, ArrowRight, Scale, MessageCircle } from "lucide-react";
import { RoomType } from "@/types/room";
import { generateIdenticonAvatar } from "@/utils/generateAvatar";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Native"];
const BAR_HEIGHTS = [5, 7, 9, 11];
const MAX_TILES = 5;

type Member = RoomType["members"][number];

function LevelMeter({ level }: { level: string }) {
  const index = LEVELS.indexOf(level);
  const filled = (index === -1 ? 0 : index) + 1;

  return (
    <span className="flex items-center gap-2 text-gray-300">
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {BAR_HEIGHTS.map((height, i) => (
          <span
            key={i}
            style={{ height }}
            className={`w-[3px] rounded-[1px] ${
              i < filled ? "bg-green-400" : "bg-white/[0.14]"
            }`}
          />
        ))}
      </span>
      {level}
    </span>
  );
}

function getTileSize(maxParticipants: number, isUnlimited: boolean) {
  if (isUnlimited) return "w-12 h-12";
  if (maxParticipants === 4) return "w-[72px] h-[72px]";
  if (maxParticipants === 3) return "w-[90px] h-[90px]";
  if (maxParticipants <= 2) return "w-[100px] h-[100px]";
  return "w-12 h-12";
}

function NameTooltip({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-8 left-1/2 z-20 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-white/[0.08] bg-[#0c0c0c] px-2.5 py-1 text-[10px] text-gray-200 opacity-0 shadow-xl transition-all duration-150 group-hover/avatar:translate-y-0 group-hover/avatar:opacity-100"
    >
      {name}
    </div>
  );
}

function MemberTile({ member, size }: { member: Member; size: string }) {
  return (
    <div className="group/avatar relative" role="img" aria-label={member.name}>
      <div
        className={`relative ${size} overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover/avatar:-translate-y-0.5 group-hover/avatar:border-white/[0.18] group-hover/avatar:shadow-[0_8px_24px_rgba(0,0,0,0.35)] motion-reduce:transition-none`}
      >
        {member.avatar ? (
          <Image
            src={member.avatar}
            alt=""
            fill
            sizes="100px"
            className="object-cover"
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: generateIdenticonAvatar(member.name, 150),
            }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          />
        )}
      </div>
      <NameTooltip name={member.name} />
    </div>
  );
}

function EmptySlot({ size }: { size: string }) {
  return (
    <div
      className={`${size} flex items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.015] transition-colors duration-200 group-hover:border-white/[0.12]`}
      aria-hidden="true"
    >
      <div className="h-2 w-2 rounded-full bg-white/[0.08]" />
    </div>
  );
}

export const RoomCard = memo(function RoomCard({ room }: { room: RoomType }) {
  const isEnded = room.status === "ended";
  const isDebate = room.type === "debate";
  const isUnlimited =
    room.maxParticipants === 0 || room.maxParticipants === Infinity;
  const isFull = !isUnlimited && room.members.length >= room.maxParticipants;

  const size = getTileSize(room.maxParticipants, isUnlimited);

  const totalSlots = isUnlimited ? room.members.length : room.maxParticipants;
  const hasOverflow = totalSlots > MAX_TILES;
  const visibleCount = hasOverflow ? MAX_TILES - 1 : totalSlots;
  const hiddenCount = totalSlots - visibleCount;

  const base =
    "group relative flex h-[272px] flex-col rounded-2xl border bg-[#161616] p-5 transition-all duration-300 motion-reduce:transition-none";

  const content = (
    <>
      {!isEnded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      {/* Header — fixed height so avatar rows align across every card in a row */}
      <div className="flex h-[66px] items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5 text-xs text-gray-400">
            <LevelMeter level={room.level} />
            <span aria-hidden="true" className="h-3 w-px shrink-0 bg-white/10" />
            <span className="flex min-w-0 items-center gap-1.5">
              <Globe2 size={12} className="shrink-0 text-gray-500" />
              <span className="truncate">{room.language}</span>
            </span>
          </div>

          <h3 className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-white">
            {room.title}
          </h3>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className="flex items-center gap-1.5 text-xs tabular-nums text-gray-400"
            aria-label={`${room.members.length} of ${
              isUnlimited ? "unlimited" : room.maxParticipants
            } participants`}
          >
            <Users size={12} className="text-gray-500" />
            {room.members.length}/{isUnlimited ? "∞" : room.maxParticipants}
          </span>

          {isEnded ? (
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Ended
            </span>
          ) : isFull ? (
            <span className="text-[11px] font-medium uppercase tracking-wider text-gray-300">
              Full
            </span>
          ) : null}
        </div>
      </div>

      {/* Participants */}
      <div className="flex flex-1 items-center justify-center">
        {totalSlots === 0 ? (
          <p className="text-xs text-gray-600">No one here yet. Be the first.</p>
        ) : (
          <div className="flex items-center justify-center gap-2.5">
            {Array.from({ length: visibleCount }).map((_, index) => {
              const member = room.members[index];
              return member ? (
                <MemberTile key={member.id} member={member} size={size} />
              ) : (
                <EmptySlot key={`empty-${index}`} size={size} />
              );
            })}

            {hasOverflow && (
              <div
                className={`${size} flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-xs font-medium tabular-nums text-gray-400`}
                aria-label={`${hiddenCount} more`}
              >
                +{hiddenCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-gray-500">
          {isDebate ? <Scale size={12} /> : <MessageCircle size={12} />}
          {isDebate ? "Debate" : "Open conversation"}
        </span>

        {isEnded ? (
          <span className="font-medium text-gray-600">Room unavailable</span>
        ) : (
          <span className="flex items-center gap-1.5 font-medium text-green-400 transition-all duration-200 group-hover:gap-2.5">
            {isFull ? "View room" : "Join room"}
            <ArrowRight
              size={13}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        )}
      </div>
    </>
  );

  if (isEnded) {
    return (
      <div
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-white/[0.04] opacity-60`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/room/${room.id}`}
      className={`${base} border-white/[0.07] hover:-translate-y-0.5 hover:border-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 motion-reduce:hover:translate-y-0`}
    >
      {content}
    </Link>
  );
});