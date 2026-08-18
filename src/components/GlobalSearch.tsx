"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Deliberately not importing normalizeHandle from lib/publicHandle here —
// that module pulls in Node's fs/Redis client transitively via lib/store,
// which can't run in a client bundle. The normalization itself is trivial.
function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

export default function GlobalSearch() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const handle = normalizeHandle(value).replace(/^@/, "");
    if (!handle) return;
    router.push(`/u/${handle}`);
    setValue("");
  }

  return (
    <form onSubmit={onSubmit} className="hidden sm:block">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Aller à @pseudo…"
        className="w-36 bg-transparent border border-shelf-border rounded-full px-3 py-1 text-xs text-shelf-text outline-none focus:border-brass/50 focus:w-44 transition-all"
      />
    </form>
  );
}
