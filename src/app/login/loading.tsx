export default function LoginLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 space-y-2">
          <div className="h-7 w-40 bg-white/10 rounded animate-pulse mx-auto" />
          <div className="h-4 w-52 bg-white/10 rounded animate-pulse mx-auto" />
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-12 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    </main>
  )
}
