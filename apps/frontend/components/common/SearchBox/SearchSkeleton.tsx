import React from 'react'

export default function SearchSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="h-5 w-full bg-gray-700 animate-pulse rounded"></li>
      ))}
    </ul>
  );
}
