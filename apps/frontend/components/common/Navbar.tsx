"use client";
import React from "react";
import { BookOpenCheck, LogIn, Plus, LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { openCreateRoomModal } from "@/libs/features/modal/modalSlice";
import Link from "next/link";
import CreateRoomModal from "../CreateRoomModal";

export function Navbar() {
  const dispatch = useAppDispatch();
  const roomIsOpen = useAppSelector((state) => state.modal.createRoomModal.isOpen);
  const user = useAppSelector((state) => state.auth.user);
  console.log("Navbar user state:", user);

  const modalHandler = () => {
    dispatch(openCreateRoomModal());
  };

  const logoutHandler = () => {
    localStorage.removeItem("auth");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <>
      <nav className="sticky top-0 z-50">
        {/* Glass surface */}
        <div
          className="border-b border-white/[0.06]"
          style={{
            background: 'rgba(17, 17, 17, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">

              {/* Logo + Brand */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-green-500/20 blur-md group-hover:blur-lg transition-all duration-300" />
                  <div className="relative bg-green-500/10 border border-green-500/20 p-2 rounded-xl group-hover:border-green-500/40 transition-all duration-300">
                    <BookOpenCheck className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white font-semibold text-base tracking-tight">Syncora24</span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Practice Rooms</span>
                </div>
              </Link>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                {user !== undefined ? (
                  user ? (
                    <>
                      {/* Create Room */}
                      <button
                        onClick={modalHandler}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300 transition-all duration-200 active:scale-95"
                      >
                        <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                        <span className="hidden sm:inline">Create Room</span>
                      </button>

                      {/* User Avatar + Logout */}
                      <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                        {/* Avatar circle from user initial */}
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-semibold">
                          {user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={logoutHandler}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] text-gray-400 text-sm hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 active:scale-95"
                          title="Sign out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </Link>
                  )
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-gray-300 animate-spin" />
                    <span className="text-gray-500 text-sm">Loading</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      <CreateRoomModal isOpen={roomIsOpen} />
    </>
  );
}