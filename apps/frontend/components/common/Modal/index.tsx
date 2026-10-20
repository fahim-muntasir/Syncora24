"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  children: React.ReactNode;
  backdrop?: React.ReactNode;
  onClose?: () => void;
  labelledBy?: string;
  size?: "md" | "lg";
};

const sizes = {
  md: "max-w-xl",
  lg: "max-w-4xl",
};

export default function Modal({
  children,
  backdrop,
  onClose,
  labelledBy,
  size = "lg",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  const modalRoot = document.querySelector("#modal-portal");
  if (!modalRoot) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0b0b0b]/85 p-4 transition-opacity duration-200 ease-out motion-reduce:transition-none backdrop-blur-sm ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {backdrop}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`relative my-auto w-full ${sizes[size]} rounded-2xl border border-white/[0.08] bg-[#141414]`}
      >
        {/* Top accent line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent"
        />
        {children}
      </div>
    </div>,
    modalRoot,
  );
}