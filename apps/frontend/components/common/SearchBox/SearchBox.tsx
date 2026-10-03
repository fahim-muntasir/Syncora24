"use client";

import React, { useState } from "react";
import type { FormEvent } from "react";
import { Search, X } from "lucide-react";
import {
  addSearchKeyword,
  clearSearchKeywords,
  removeSearchKeyword,
} from "@/libs/features/filter/filterSlice";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";

export default function SearchBox() {
  const dispatch = useAppDispatch();
  const searchKeywords = useAppSelector(
    (state) => state.filter.searchKeywords,
  );
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(addSearchKeyword(query));
    setQuery("");
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative w-full">
        <div
          className={`group relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all duration-200 ${
            isFocused
              ? "border-white/[0.16] bg-[#181818] shadow-[0_0_0_3px_rgba(255,255,255,0.025)]"
              : "border-white/[0.08] bg-[#141414] hover:border-white/[0.12]"
          }`}
        >
          {/* Search icon */}
          <Search
            className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
              isFocused ? "text-gray-300" : "text-gray-500"
            }`}
            strokeWidth={1.8}
          />

          {/* Search keywords */}
          {searchKeywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex h-6 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.045] px-2 text-xs font-medium text-gray-300 transition-colors duration-150 hover:border-white/[0.12] hover:bg-white/[0.07]"
            >
              <span className="max-w-[180px] truncate">{keyword}</span>

              <button
                type="button"
                onClick={() => dispatch(removeSearchKeyword(keyword))}
                aria-label={`Remove search keyword ${keyword}`}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:bg-white/[0.08] hover:text-gray-200"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>
          ))}

          {/* Search input */}
          <input
            type="text"
            value={query}
            placeholder="Search rooms, topics, languages, levels, or members..."
            autoComplete="off"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Backspace" &&
                query.length === 0 &&
                searchKeywords.length > 0
              ) {
                event.preventDefault();
                dispatch(
                  removeSearchKeyword(
                    searchKeywords[searchKeywords.length - 1],
                  ),
                );
              }
            }}
            className="h-6 min-w-[180px] flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
          />

          {/* Clear all */}
          {(query || searchKeywords.length > 0) && (
            <div className="ml-auto flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  dispatch(clearSearchKeywords());
                }}
                aria-label="Clear search"
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 transition-colors duration-150 hover:bg-white/[0.06] hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}