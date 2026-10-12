import React, { useMemo } from "react";

interface VolumeIndicatorProps {
  volume: number;
}

export default function VolumeIndicator({ volume }: VolumeIndicatorProps) {
  const normalizedVolume = Math.max(0, Math.min(1, volume));

  const bars = useMemo(
    () => [
      normalizedVolume > 0.12,
      normalizedVolume > 0.28,
      normalizedVolume > 0.45,
      normalizedVolume > 0.65,
      normalizedVolume > 0.85,
    ],
    [normalizedVolume],
  );

  const baseHeights = [6, 10, 14, 10, 6];
  const scaleFactors = [1.2, 1.4, 1.8, 1.4, 1.2];

  return (
    <div
      className="flex h-6 items-center gap-0.5 rounded-md bg-black/60 px-1.5"
      role="img"
      aria-label="Speaking"
      title="Speaking"
    >
      {bars.map((active, index) => (
        <span
          key={index}
          className={`w-[2px] rounded-full transition-all duration-75 ease-out motion-reduce:transition-none ${
            active ? "bg-emerald-400" : "bg-white/20"
          }`}
          style={{
            height: `${active ? Math.round(baseHeights[index] * scaleFactors[index]) : baseHeights[index]}px`,
            maxHeight: 18,
          }}
        />
      ))}
    </div>
  );
}