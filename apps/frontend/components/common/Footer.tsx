import React from "react";
import { siteConfig } from "@/config/site";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60";

export default function Footer() {
  const { creator } = siteConfig;

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#111111]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col gap-2 py-5 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>

          {creator.name && (
            <p>
              Built by{" "}
              {creator.url ? (
                <a
                  href={creator.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded text-gray-400 transition-colors hover:text-white motion-reduce:transition-none ${focusRing}`}
                >
                  {creator.name}
                </a>
              ) : (
                <span className="text-gray-400">{creator.name}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}