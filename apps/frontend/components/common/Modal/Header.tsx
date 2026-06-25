import React from "react";
import { X } from "lucide-react";

type HeaderProps = {
  onClose: () => void;
  title: string;
};

export default function Header({ onClose, title }: HeaderProps) {
  return (
    <div className="border-b border-gray-800 p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
