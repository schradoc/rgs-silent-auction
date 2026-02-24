export default function PrizeDetailLoading() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header skeleton */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Hero image skeleton */}
      <div className="max-w-4xl mx-auto">
        <div className="aspect-[16/10] sm:aspect-[2/1] bg-gray-200 animate-pulse" />

        <div className="px-4 sm:px-6 -mt-8 relative z-10">
          {/* Main content card skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-7 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="space-y-2 sm:text-right">
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse sm:ml-auto" />
                  <div className="h-10 w-36 bg-gray-100 rounded animate-pulse sm:ml-auto" />
                </div>
              </div>

              {/* Bid area skeleton */}
              <div className="space-y-3">
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                </div>
                <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Description card skeleton */}
          <div className="mt-6 bg-white rounded-2xl p-8 sm:p-10 border border-gray-100">
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="h-32" />
        </div>
      </div>
    </main>
  )
}
