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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(addSearchKeyword(query));
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSearch}
      role="search"
      className="relative w-full"
    >
      <div className="group flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.07] bg-[#161616] px-3.5 py-1.5 transition-colors duration-200 hover:border-white/[0.12] focus-within:border-white/[0.2] motion-reduce:transition-none">
        <Search
          className="h-4 w-4 shrink-0 text-gray-500 transition-colors duration-200 group-focus-within:text-gray-300"
          strokeWidth={1.8}
          aria-hidden="true"
        />

        {searchKeywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex h-6 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] pl-2 pr-1 text-xs font-medium text-gray-300"
          >
            <span className="max-w-[180px] truncate">{keyword}</span>
            <button
              type="button"
              onClick={() => dispatch(removeSearchKeyword(keyword))}
              aria-label={`Remove search keyword ${keyword}`}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:bg-white/[0.08] hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={query}
          placeholder="Search rooms, topics, languages, levels or members"
          aria-label="Search rooms"
          autoComplete="off"
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
          className="h-6 min-w-[160px] flex-1 truncate bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
        />

        {(query || searchKeywords.length > 0) && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {query.trim() && (
              <span className="hidden text-[11px] text-gray-600 sm:inline">
                Press Enter to add filter
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                dispatch(clearSearchKeywords());
              }}
              aria-label="Clear search"
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors duration-150 hover:bg-white/[0.06] hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </form>
  );
}