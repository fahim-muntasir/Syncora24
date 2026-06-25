import React from 'react'
import { BookOpenCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-[#1C1C1C]">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1432821596592-e2c18b78144f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80")',
        }}
      />

      {/* Content */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-green-500/10 p-4 rounded-full border border-green-500/20 mb-6">
            <BookOpenCheck className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">
          Welcome to Verbly
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Your journey to communication starts here
        </p>
      </div>

      <div className="mt-8 sm:mx-auto mx-auto w-11/12 sm:w-full sm:max-w-md relative z-10">
        <div className="bg-background border border-gray-900 rounded-lg relative">
          {children}
        </div>
      </div>
    </div>
  )
}
