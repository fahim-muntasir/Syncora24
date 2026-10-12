import React from "react";

export default function ControlButton({
  icon: Icon,
  active = false,
  warn = false,
  danger = false,
  disabled = false,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ size: number }>;
  active?: boolean;
  warn?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const tone = danger
    ? "border-red-500/30 bg-red-500 text-white hover:bg-red-400"
    : warn
      ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15"
      : active
        ? "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/15"
        : "border-white/[0.08] bg-white/[0.04] text-gray-300 hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group relative flex items-center justify-center rounded-xl focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60"
    >
      {label && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/[0.08] bg-[#161616] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          {label}
        </span>
      )}

      <span
        className={`flex items-center justify-center rounded-xl border p-2.5 transition-colors duration-150 motion-reduce:transition-none sm:p-3.5 ${tone} ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        <Icon size={18} />
      </span>
    </button>
  );
}