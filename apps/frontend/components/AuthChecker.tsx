"use client";
import { useCheckAuth } from "@/hooks/useCheckAuth";
import LoadingSpinner from "./LoadingSpinner";

export const AuthChecker = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useCheckAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return children;
};