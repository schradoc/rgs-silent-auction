'use client'

import { AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui'

export default function AdminDashboardError({
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
        <h2 className="text-lg font-bold text-[#1e3a5f] mb-2">Dashboard error</h2>
        <p className="text-gray-600 text-sm mb-6">
          The admin dashboard encountered an error. Please try refreshing.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="gold">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/admin/login'} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Re-login
          </Button>
        </div>
      </div>
    </div>
  )
}
