export default function PrizesLoading() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header skeleton */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
              <div className="hidden sm:block space-y-1">
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              <div className="w-24 h-9 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero stats skeleton */}
      <section className="bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] text-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
        </div>
      </section>

      {/* Filter bar skeleton */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-full bg-gray-100 animate-pulse"
                style={{ width: `${60 + i * 10}px` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Prize grid skeleton */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
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
      </section>
    </main>
  )
}
