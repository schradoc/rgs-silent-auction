export default function RegisterLoading() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Step indicator skeleton */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-16 h-0.5 bg-gray-200 rounded-full" />
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="text-center space-y-2 mb-6">
            <div className="h-7 w-40 bg-gray-100 rounded animate-pulse mx-auto" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mx-auto" />
          </div>
          <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </main>
  )
}
