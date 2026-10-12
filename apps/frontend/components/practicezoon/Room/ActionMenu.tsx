"use client";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SwitchTrack } from "./ToggleSwitch";

export type MenuItem =
  | { type: "heading"; id: string; text: string }
  | { type: "separator"; id: string }
  | {
      type: "toggle";
      id: string;
      label: string;
      hint?: string;
      icon?: LucideIcon;
      checked: boolean;
      disabled?: boolean;
      onChange: (next: boolean) => void;
    }
  | {
      type: "action";
      id: string;
      label: string;
      icon?: LucideIcon;
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    };

type ActionMenuProps = {
  items: MenuItem[];
  label?: string;
  triggerClassName?: string;
};

const itemBase =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors focus-visible:bg-white/[0.06] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export default function ActionMenu({
  items,
  label = "Participant actions",
  triggerClassName = "",
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    let top = rect.bottom + 4;
    if (top + menu.offsetHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - menu.offsetHeight - 4);
    }
    const left = Math.min(
      Math.max(margin, rect.right - menu.offsetWidth),
      window.innerWidth - menu.offsetWidth - margin,
    );
    setPos((prev) =>
      prev && prev.top === top && prev.left === left ? prev : { top, left },
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, items, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);

    const frame = requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')
        ?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const elements = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role^="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    if (elements.length === 0) return;
    event.preventDefault();
    const index = elements.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (index + 1) % elements.length
        : (index - 1 + elements.length) % elements.length;
    elements[next].focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none ${
          open ? "bg-white/[0.1] text-white" : ""
        } ${triggerClassName}`}
      >
        <MoreVertical size={15} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? "visible" : "hidden",
            }}
            className="fixed z-[60] max-h-[calc(100dvh-16px)] w-64 overflow-y-auto rounded-xl border border-white/[0.1] bg-[#161616] py-1.5"
          >
            {items.map((item) => {
              if (item.type === "separator") {
                return (
                  <div
                    key={item.id}
                    role="separator"
                    className="my-1.5 border-t border-white/[0.06]"
                  />
                );
              }

              if (item.type === "heading") {
                return (
                  <div
                    key={item.id}
                    className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-gray-500"
                  >
                    {item.text}
                  </div>
                );
              }

              const Icon = item.icon;

              if (item.type === "toggle") {
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={item.checked}
                    disabled={item.disabled}
                    onClick={() => item.onChange(!item.checked)}
                    className={`${itemBase} text-gray-200 hover:bg-white/[0.05]`}
                  >
                    {Icon && <Icon size={14} className="shrink-0 text-gray-500" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.label}</span>
                      {item.hint && (
                        <span className="block text-[11px] text-gray-500">
                          {item.hint}
                        </span>
                      )}
                    </span>
                    <SwitchTrack checked={item.checked} />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect();
                    close();
                  }}
                  className={`${itemBase} ${
                    item.danger
                      ? "text-red-400 hover:bg-red-500/[0.08]"
                      : "text-gray-200 hover:bg-white/[0.05]"
                  }`}
                >
                  {Icon && (
                    <Icon
                      size={14}
                      className={`shrink-0 ${item.danger ? "text-red-400" : "text-gray-500"}`}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}