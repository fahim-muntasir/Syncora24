import React from "react";

export default function ControlButton({
  icon: Icon,
  active = false,
  onClick,
  label,
  danger = false,
}: {
  icon: React.ComponentType<{ size: number }>;
  active?: boolean;
  onClick?: () => void;
  label?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-2xl"
    >
      {/* Tooltip */}
      {label && (
        <div
          className="
            pointer-events-none
            absolute
            bottom-full
            mb-3
            left-1/2
            -translate-x-1/2
            opacity-0
            translate-y-1
            group-hover:opacity-100
            group-hover:translate-y-0
            group-focus-visible:opacity-100
            group-focus-visible:translate-y-0
            transition-all
            duration-200
            z-50
          "
        >
          <div className="relative whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#161616]/95 backdrop-blur-xl px-3 py-1.5 shadow-2xl">
            <span className="text-[11px] font-medium text-white">
              {label}
            </span>

            {/* Arrow */}
            <div className="absolute left-1/2 top-full -translate-x-1/2">
              <div className="w-2.5 h-2.5 rotate-45 bg-[#161616] border-r border-b border-white/[0.08]" />
            </div>
          </div>
        </div>
      )}

      {/* Button */}
      <div
        className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 ${
          danger
            ? "bg-red-500/90 border-red-500/0 text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
            : active
            ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 hover:border-green-500/50"
            : "bg-white/[0.05] border-white/[0.08] text-gray-400 hover:bg-white/[0.10] hover:border-white/[0.14] hover:text-white"
        }`}
      >
        <Icon size={18} />
      </div>
    </button>
  );
}