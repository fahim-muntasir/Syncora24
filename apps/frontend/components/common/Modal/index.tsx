"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  children: React.ReactNode;
};

export default function Modal({ children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Slight delay so the enter animation actually fires
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!mounted) return null;

  const modalRoot = document.querySelector("#modal-portal");
  if (!modalRoot) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl mx-4 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.97]"
        }`}
        style={{ background: "rgba(18, 18, 18, 0.98)" }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent)" }}
        />
        {children}
      </div>
    </div>,
    modalRoot
  );
}