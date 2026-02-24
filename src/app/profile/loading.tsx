export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header skeleton */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse mx-auto" />
              <div className="h-6 w-8 bg-gray-100 rounded animate-pulse mx-auto" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Profile info skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="w-11 h-6 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </main>
  )
}
