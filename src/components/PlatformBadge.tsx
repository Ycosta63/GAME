import type { Platform } from "@/types/game";

const STYLES: Record<Platform, string> = {
  steam: "bg-[#1b2838] text-[#66c0f4] border-[#2a475e]",
  psn: "bg-[#003791] text-[#8ecdff] border-[#0057c2]",
};

const LABELS: Record<Platform, string> = {
  steam: "Steam",
  psn: "PlayStation",
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STYLES[platform]}`}
    >
      {LABELS[platform]}
    </span>
  );
}
