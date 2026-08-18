import React, { useMemo } from "react";

interface VolumeIndicatorProps {
  volume: number;
}

export default function VolumeIndicator({ volume }: VolumeIndicatorProps) {
  const normalizedVolume = Math.max(0, Math.min(1, volume)); // 0-1 range

  const bars = useMemo(() => {
    return [
      normalizedVolume > 0.12,
      normalizedVolume > 0.28,
      normalizedVolume > 0.45,
      normalizedVolume > 0.65,
      normalizedVolume > 0.85,
    ];
  }, [normalizedVolume]);

  const getBarHeight = (index: number, isActive: boolean) => {
    const baseHeights = [6, 10, 14, 10, 6];
    if (!isActive) return baseHeights[index];
    
    // Active bars grow based on volume
    const scaleFactors = [1.2, 1.4, 1.8, 1.4, 1.2];
    return Math.round(baseHeights[index] * scaleFactors[index]);
  };

  return (
    <div
      className="flex items-center gap-1 h-4 px-1.5 py-0.5"
      aria-label="Speaking volume indicator"
    >
      {bars.map((active, index) => (
        <div
          key={index}
          className={`rounded-full transition-all duration-75 ease-out ${
            active
              ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
              : "bg-white/15"
          }`}
          style={{
            width: "2px",
            height: `${getBarHeight(index, active)}px`,
            opacity: active ? 1 : 0.6,
            filter: active ? "drop-shadow(0 0 2px rgba(52, 211, 153, 0.3))" : "none",
          }}
        />
      ))}
    </div>
  );
}