export default function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
      {Array.from({ length: 21 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full rounded-md bg-shelf-surface border border-shelf-border animate-pulse"
          style={{ animationDelay: `${(i % 7) * 60}ms` }}
        />
      ))}
    </div>
  );
}
