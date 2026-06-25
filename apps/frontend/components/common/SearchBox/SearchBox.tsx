"use client";
import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useDebounce from "@/hooks/useDebounce";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  // mock effect (replace with API later)
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    // dummy filtered results (UI-only placeholder)
    setResults([
      debouncedQuery,
      debouncedQuery + " example",
      debouncedQuery + " tutorial",
    ]);
  }, [debouncedQuery]);

  const handleSelect = (selected: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("q", selected);

    setQuery(selected);
    router.push(`/search?${currentParams.toString()}`);

    setShowDropdown(false);
  };

  const onBlurHandler = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setResults([]);
      setIsFocused(false);
    }, 200);
  };

  const clearQuery = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="w-full md:w-3/5 lg:w-2/5 mx-auto relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSelect(query);
        }}
        className="relative"
      >
        {/* Glow behind input */}
        <div
          className={`absolute -inset-px rounded-2xl transition-opacity duration-300 pointer-events-none ${
            isFocused ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(168,85,247,0.15))",
            filter: "blur(8px)",
          }}
        />

        <div
          className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
            isFocused
              ? "bg-[#1a1a1a] border-green-500/40 shadow-lg shadow-green-500/5"
              : "bg-[#181818] border-white/[0.08] hover:border-white/[0.14]"
          }`}
        >
          <Search
            className={`absolute left-4 w-4 h-4 transition-colors duration-200 ${
              isFocused ? "text-green-400" : "text-gray-500"
            }`}
          />

          <input
            type="text"
            placeholder="Search..."
            value={query}
            onFocus={() => {
              setShowDropdown(true);
              setIsFocused(true);
            }}
            onBlur={onBlurHandler}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent py-3 pl-11 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none rounded-2xl"
          />

          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-4 text-gray-500 hover:text-white transition-colors duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/[0.08] overflow-hidden z-50 shadow-2xl shadow-black/60"
            style={{
              background: "rgba(20, 20, 20, 0.98)",
              backdropFilter: "blur(24px)",
            }}
          >
            {results.length === 0 ? (
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-sm">No results found</p>
              </div>
            ) : (
              <ul className="py-1.5">
                {results.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.05] transition-colors duration-150 group"
                    onMouseDown={() => handleSelect(item)}
                  >
                    <Search className="w-3.5 h-3.5 text-gray-600 group-hover:text-green-400" />
                    <span className="text-sm text-gray-300 group-hover:text-white truncate">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="px-4 py-2 border-t border-white/[0.05] flex items-center justify-between">
              <span className="text-[11px] text-gray-600">
                Press Enter to search
              </span>
              <kbd className="text-[10px] text-gray-600 border border-white/[0.08] rounded px-1.5 py-0.5 font-mono">
                ↵
              </kbd>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}