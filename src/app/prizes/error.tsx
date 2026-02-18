'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui'

export default function PrizesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-[#1e3a5f] mb-2">Failed to load prizes</h2>
        <p className="text-gray-600 text-sm mb-6">
          We couldn&apos;t load the prize listing. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="gold">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
