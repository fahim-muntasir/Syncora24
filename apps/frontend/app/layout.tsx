import type { Metadata } from "next";
import { DM_Sans, Goldman, Inter } from "next/font/google";
import StoreProvider from "@/components/provider/StoreProvider";
import { Toaster } from "react-hot-toast";
import { AuthChecker } from "@/components/AuthChecker";
import SocketInitializer from "@/components/provider/SocketInitializer";
import AuthenticationModalHost from "@/components/Auth/AuthenticationModal";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"], // Specify subsets
  weight: ["400", "500", "700"], // Specify weights (optional)
  variable: "--font-dm-sans", // Define a CSS variable for Tailwind integration
});

const goldman = Goldman({
  subsets: ["latin"], // Specify subsets
  weight: ["400", "700"], // Specify weights (optional)
  variable: "--font-goldman", // Define a CSS variable for Tailwind integration
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Syncora24 — Practice Speaking With Real People",
  description:
    "A real-time language practice platform where you can join conversation rooms, chat, and practice speaking with people from around the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` ${dmSans.variable} ${goldman.variable} ${inter.variable} antialiased`}>
        <StoreProvider>
          <AuthChecker>
            <SocketInitializer />
            {children}
          </AuthChecker>
          <AuthenticationModalHost />
        </StoreProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <div id="modal-portal"></div>
      </body>
    </html>
  );
}
