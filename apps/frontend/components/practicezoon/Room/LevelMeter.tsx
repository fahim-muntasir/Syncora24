import React from "react";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Native"];
const BAR_HEIGHTS = [5, 7, 9, 11];

export default function LevelMeter({ level }: { level: string }) {
  const index = LEVELS.indexOf(level);
  const filled = (index === -1 ? 0 : index) + 1;

  return (
    <span className="flex items-center gap-2">
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {BAR_HEIGHTS.map((height, i) => (
          <span
            key={i}
            style={{ height }}
            className={`w-[3px] rounded-[1px] ${i < filled ? "bg-green-400" : "bg-white/[0.14]"}`}
          />
        ))}
      </span>
      {level}
    </span>
  );
}