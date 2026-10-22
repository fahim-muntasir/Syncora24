"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import { openAuthenticationModal } from "@/libs/features/modal/modalSlice";

const AuthenticationModalContent = dynamic(
  () => import("./AuthenticationModalContent"),
  { ssr: false },
);

export default function AuthenticationModalHost() {
  const dispatch = useAppDispatch();
  const authModal = useAppSelector((state) => state.modal.authModal);

  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedMode = url.searchParams.get("auth");
    if (requestedMode !== "signin" && requestedMode !== "signup") return;

    dispatch(openAuthenticationModal(requestedMode));
    url.searchParams.delete("auth");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [dispatch]);

  if (!authModal.isOpen) return null;
  return <AuthenticationModalContent mode={authModal.mode} />;
}
