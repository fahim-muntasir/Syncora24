import React from "react";

export default function Footer() {
  return (
    <footer
      aria-label="Syncora24 footer"
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#111111]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none relative h-[16.5vw] w-full select-none overflow-hidden"
      >
        <span className="absolute left-1/2 top-0 block -translate-x-1/2 whitespace-nowrap bg-clip-text font-footer-wordmark text-[20.9vw] font-extrabold leading-[0.85] tracking-[-0.05em] text-emerald-50/[0.06]">
          Syncora24
        </span>
      </div>
    </footer>
  );
}