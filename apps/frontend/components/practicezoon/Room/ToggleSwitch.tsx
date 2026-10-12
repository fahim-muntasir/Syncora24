import React from "react";

export function SwitchTrack({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none ${
        checked
          ? "border-green-500/60 bg-green-500"
          : "border-white/[0.14] bg-white/[0.08]"
      }`}
    >
      <span
        className={`h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 motion-reduce:transition-none ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </span>
  );
}

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-white/[0.07] bg-[#161616] px-3.5 py-3 text-left transition-colors hover:border-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
            {description}
          </span>
        )}
      </span>
      <SwitchTrack checked={checked} />
    </button>
  );
}