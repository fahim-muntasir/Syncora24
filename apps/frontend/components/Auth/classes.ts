export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60";

export const primaryButton = `inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-medium text-white transition-colors duration-150 enabled:hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${focusRing}`;

export const secondaryButton = `inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-4 text-sm font-medium text-gray-200 transition-colors duration-150 enabled:hover:border-white/[0.2] enabled:hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${focusRing}`;

export const textButton = `rounded font-medium text-green-400 transition-colors hover:text-green-300 motion-reduce:transition-none ${focusRing}`;