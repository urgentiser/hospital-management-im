export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid animate-pulse gap-4 px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-3 rounded bg-muted/70" />
          ))}
        </div>
      ))}
    </div>
  );
}
