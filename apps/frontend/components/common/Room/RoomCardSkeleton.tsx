import Bone from "./Bone";

export default function RoomCardSkeleton() {
  return (
    <div
      className="flex h-[272px] flex-col rounded-2xl border border-white/[0.07] bg-[#161616] p-5"
      aria-hidden="true"
    >
      <div className="flex h-[66px] items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-16" />
          </div>
          <Bone className="mt-3 h-3.5 w-4/5" />
          <Bone className="mt-2 h-3.5 w-3/5 bg-white/[0.04]" />
        </div>
        <Bone className="h-3 w-9" />
      </div>

      <div className="flex flex-1 items-center justify-center gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-12 w-12 rounded-xl" />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
        <Bone className="h-3 w-20 bg-white/[0.04]" />
        <Bone className="h-3 w-16" />
      </div>
    </div>
  );
}