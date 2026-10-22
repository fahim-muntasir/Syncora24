"use client";
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { LogIn, LogOut, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { userLoggedOut } from "@/libs/features/auth/authSlice";
import { useLogoutMutation } from "@/libs/features/auth/authApiSlice";
import {
  openAuthenticationModal,
  openCreateRoomModal,
} from "@/libs/features/modal/modalSlice";

const CreateRoomModal = dynamic(() => import("../CreateRoomModal"), {
  ssr: false,
});

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60";

export function Navbar() {
  const dispatch = useAppDispatch();
  const roomIsOpen = useAppSelector((state) => state.modal.createRoomModal.isOpen);
  const user = useAppSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();

  const modalHandler = () => {
    dispatch(openCreateRoomModal());
  };

  const logoutHandler = async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("auth");
      dispatch(userLoggedOut());
      dispatch(openAuthenticationModal("choice"));
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#111111]/80 backdrop-blur-md">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            className={`group flex items-center gap-3 rounded-lg ${focusRing}`}
          >
            <Image src="/logo.png"
              alt="Syncora24"
              width={125}
              height={34}
              priority
              className="h-auto w-[110px] transition-opacity duration-200 group-hover:opacity-85 sm:w-[135px]" />
          </Link>

          <div className="flex items-center gap-2">
            {user === undefined ? (
              <div
                className="flex items-center gap-2"
                role="status"
                aria-label="Loading account"
              >
                <div className="h-9 w-9 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none sm:w-[132px]" />
                <span className="mx-1 h-5 w-px bg-white/[0.06]" aria-hidden="true" />
                <div className="h-9 w-[76px] animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none" />
              </div>
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={modalHandler}
                  className={`group flex h-9 items-center gap-2 rounded-lg bg-green-500 px-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-400 active:scale-[0.98] motion-reduce:transition-none sm:px-3.5 ${focusRing}`}
                  aria-label="Create room"
                >
                  <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90 motion-reduce:transition-none" />
                  <span className="hidden sm:inline">Create room</span>
                </button>

                <span className="mx-1 h-5 w-px bg-white/[0.08]" aria-hidden="true" />

                <div
                  className="flex h-9 w-9 select-none items-center justify-center rounded-lg border border-white/[0.08] bg-[#161616] text-xs font-semibold text-gray-200"
                  title={user?.fullName}
                  aria-label={user?.fullName ? `Signed in as ${user.fullName}` : "Signed in"}
                >
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>

                <button
                  type="button"
                  onClick={logoutHandler}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-400 transition-colors duration-200 hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white active:scale-[0.98] motion-reduce:transition-none ${focusRing}`}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => dispatch(openAuthenticationModal("choice"))}
                className={`flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] px-3.5 text-sm font-medium text-white transition-colors duration-200 hover:border-white/[0.2] hover:bg-white/[0.04] active:scale-[0.98] motion-reduce:transition-none ${focusRing}`}
              >
                <LogIn className="h-4 w-4 text-gray-400" />
                Sign in
              </button>
            )}
          </div>
        </nav>
      </header>

      {roomIsOpen && <CreateRoomModal isOpen />}
    </>
  );
}