export default function WelcomeLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress dots skeleton */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-2 bg-white/20 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/10 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/10 rounded-full animate-pulse" />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl animate-pulse" />
          </div>
          <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse mx-auto" />
          <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
          <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </main>
  )
}
