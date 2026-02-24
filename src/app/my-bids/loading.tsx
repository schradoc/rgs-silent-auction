export default function MyBidsLoading() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header skeleton */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Title skeleton */}
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />

        {/* Bid rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
