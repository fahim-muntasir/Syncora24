import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import AuthVisual from "@/components/Auth/AuthVisual";
import { BackgroundPattern } from "@/components/background/BackgroundPattern";
import Logo from "@/public/logo.svg";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-[#111111] lg:grid lg:grid-cols-2">
      <BackgroundPattern />

      <div className="relative flex min-h-screen flex-col px-6 sm:px-10">
        <header className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className={`group flex items-center gap-3 rounded-lg ${focusRing}`}
          >
            
            <Image src={Logo} alt="Syncora24" width={110} height={30} priority />
          </Link>

          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-400 transition-colors hover:text-white motion-reduce:transition-none ${focusRing}`}
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#141414] p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent"
            />
            {children}
          </div>
        </main>

        <footer className="py-6 text-xs text-gray-600">
          © {new Date().getFullYear()} Syncora24
        </footer>
      </div>

      <AuthVisual />
    </div>
  );
}