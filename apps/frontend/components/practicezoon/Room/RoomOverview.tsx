import React from "react";
import { MessageCircle, MonitorUp, Scale, Video } from "lucide-react";
import { RoomType } from "@/types/room";

type RoomOverviewProps = {
  room: RoomType | null;
  cameraCount: number;
  screenCount: number;
};

function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`
        pointer-events-none absolute z-10
        h-6 w-16 sm:h-7 sm:w-24
        opacity-40
        bg-[linear-gradient(100deg,rgba(255,255,255,.4),rgba(232,225,200,.3)_40%,rgba(255,255,255,.45)_55%,rgba(232,225,200,.28))]
        border-t border-t-white/50
        border-b border-b-[#78643c]/20
        shadow-[0_2px_3px_rgba(0,0,0,0.3)]
        [clip-path:polygon(0_0,2%_20%,0_40%,2%_60%,0_80%,1%_100%,100%_100%,98%_80%,100%_60%,98%_40%,100%_20%,99%_0)]
        ${className}
      `}
    />
  );
}

export default function RoomOverview({
  room,
  cameraCount,
  screenCount,
}: RoomOverviewProps) {
  if (!room) return null;

  const isDebate = room.type === "debate";
  const welcomeMessage = room.description?.trim();
  const TypeIcon = isDebate ? Scale : MessageCircle;

  return (
    <section
      aria-labelledby="room-overview-title"
      className="px-3 pt-7 sm:px-4 sm:pt-9"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div
          className="relative -rotate-[0.5deg] rounded-[2px] bg-[#f4edd8]/80 px-5 pb-6 pt-9 text-[#2b2118] shadow-[0_1px_1px_rgba(0,0,0,0.25),0_8px_14px_-6px_rgba(0,0,0,0.5),0_22px_30px_-14px_rgba(0,0,0,0.65)] sm:px-9 sm:pt-10"
        >
          <Tape className="-left-2 -top-2 -rotate-[38deg] sm:-left-5" />
          <Tape className="-right-2 -top-2 rotate-[36deg] sm:-right-5" />

          <p className="flex items-center gap-1.5 text-xs text-[#2b2118]/60">
            <TypeIcon size={13} />
            {isDebate ? "Debate room" : "Open conversation"}
          </p>

          <h1
            id="room-overview-title"
            className="mt-1 break-words font-serif text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {room.title}
          </h1>

          <p className="mt-4 whitespace-pre-line break-words font-serif text-[15px] leading-7 text-[#2b2118]/85">
            {welcomeMessage ||
              "The host hasn't posted a welcome message yet."}
          </p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-dashed border-[#2b2118]/25 pt-3 text-xs text-[#2b2118]/70">
            <span className="flex items-center gap-1.5">
              <Video
                size={13}
                className={cameraCount > 0 ? "text-emerald-700" : ""}
              />
              {cameraCount} {cameraCount === 1 ? "camera" : "cameras"}
            </span>
            <span className="flex items-center gap-1.5">
              <MonitorUp
                size={13}
                className={screenCount > 0 ? "text-emerald-700" : ""}
              />
              {screenCount}{" "}
              {screenCount === 1 ? "screen shared" : "screens shared"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}