export function LoadingSkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stone-panel h-16 w-full animate-pulse" />
      ))}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 border-4 border-deepslate-700 border-t-enchant-500 rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message = 'Nothing here yet.' }: { message?: string }) {
  return (
    <div className="stone-panel text-center py-10 text-netherite-400">
      <div className="text-4xl mb-2">📦</div>
      {message}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
  return (
    <div className="pixel-border bg-mcred-600/20 border-mcred-500 text-mcred-400 text-center py-6 px-4">
      ⚠️ {message}
    </div>
  );
}
