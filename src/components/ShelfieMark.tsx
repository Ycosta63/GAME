export default function ShelfieMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* three cartridges of different heights sitting on a shelf */}
      <rect x="1" y="9" width="5" height="13" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="8" y="4" width="5" height="18" rx="1" fill="currentColor" />
      <rect x="15" y="7" width="5" height="15" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="0" y="22" width="28" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}
