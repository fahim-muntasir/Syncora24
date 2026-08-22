"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useDebounce from "@/hooks/useDebounce";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  // Mock search — replace with API call later
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    setResults([
      trimmedQuery,
      `${trimmedQuery} example`,
      `${trimmedQuery} tutorial`,
    ]);
  }, [debouncedQuery]);

  const handleSearch = (value: string = query) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("q", trimmedValue);

    setQuery(trimmedValue);
    setShowDropdown(false);
    inputRef.current?.blur();

    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");

    router.push(`/search?${params.toString()}`);

    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Small delay so mouse selection still works
    setTimeout(() => {
      setShowDropdown(false);
      setIsFocused(false);
    }, 150);
  };

  const isSearching =
    query.trim().length > 0 && query !== debouncedQuery;

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative w-full"
      >
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-purple-500/10 blur-xl transition-opacity duration-300 ${
            isFocused ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`relative flex h-12 w-full items-center rounded-xl border transition-all duration-200 ${
            isFocused
              ? "border-green-500/40 bg-[#171717] shadow-lg shadow-green-500/[0.04]"
              : "border-white/[0.08] bg-[#151515] hover:border-white/[0.14]"
          }`}
        >

          <Search
            className={`pointer-events-none absolute left-4 h-[18px] w-[18px] transition-colors duration-200 ${
              isFocused ? "text-green-400" : "text-gray-500"
            }`}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Search rooms, topics, or conversations..."
            autoComplete="off"
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => setQuery(e.target.value)}
            className="h-full w-full rounded-2xl bg-transparent pl-11 pr-20 text-sm text-white outline-none placeholder:text-gray-600"
          />

          <div className="absolute right-3 flex items-center gap-2">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            )}

            {query && !isSearching && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                aria-label="Clear search"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {!query && (
              <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-gray-600 sm:block">
                /
              </kbd>
            )}
          </div>
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151515]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            {/* Loading */}
            {isSearching && (
              <div className="flex items-center gap-3 px-4 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-green-400" />

                <span className="text-sm text-gray-500">
                  Searching...
                </span>
              </div>
            )}

            {!isSearching &&
              query.trim() &&
              results.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                    <Search className="h-4 w-4 text-gray-600" />
                  </div>

                  <p className="text-sm font-medium text-gray-400">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Try searching for something else
                  </p>
                </div>
              )}

            {!isSearching && results.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                    Suggestions
                  </span>

                  <span className="text-[10px] text-gray-700">
                    {results.length} results
                  </span>
                </div>

                <ul className="p-1.5">
                  {results.map((item, index) => (
                    <li key={`${item}-${index}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSearch(item)}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] transition-colors group-hover:bg-green-500/10">
                          <Search className="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-green-400" />
                        </div>

                        <span className="min-w-0 flex-1 truncate text-sm text-gray-400 transition-colors group-hover:text-white">
                          {item}
                        </span>

                        <span className="text-gray-700 opacity-0 transition-opacity group-hover:opacity-100">
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-white/[0.05] px-4 py-2.5">
                  <span className="text-[10px] text-gray-600">
                    Press Enter to search
                  </span>

                  <kbd className="rounded border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                    Enter ↵
                  </kbd>
                </div>
              </div>
            )}

            {!query.trim() && (
              <div className="px-4 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/[0.08]">
                    <Search className="h-4 w-4 text-green-400" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Search anything
                    </p>

                    <p className="mt-0.5 text-xs text-gray-600">
                      Find rooms, topics, and conversations
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}