import React from "react";
import { X } from "lucide-react";

type HeaderProps = {
  onClose: () => void;
  title: string;
  description?: string;
};

export default function Header({ onClose, title, description }: HeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
      <div className="min-w-0">
        <h2 id="modal-title" className="text-base font-semibold text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}