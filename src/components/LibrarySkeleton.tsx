export default function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-1">
      {Array.from({ length: 27 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full rounded-sm bg-shelf-surface animate-pulse"
          style={{ animationDelay: `${(i % 9) * 60}ms` }}
        />
      ))}
    </div>
  );
}
