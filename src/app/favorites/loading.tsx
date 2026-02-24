export default function FavoritesLoading() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header skeleton */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title skeleton */}
        <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="aspect-[16/9] bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
