'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tableNumber: '',
  })

  const [verificationCode, setVerificationCode] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setEmail(formData.email)
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Redirect to prizes page
      router.push('/prizes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipVerification = async () => {
    // For demo purposes, allow skipping verification
    router.push('/prizes')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-[#1e3a5f] hover:text-[#2d4a6f] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>

        <Card>
          <CardContent className="p-6">
            {step === 'register' ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Register to Bid
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Enter your details to start bidding on exclusive prizes
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Table Number"
                    placeholder="e.g., 12"
                    value={formData.tableNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, tableNumber: e.target.value })
                    }
                    hint="You can find this on your table"
                    required
                  />

                  {error && (
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Continue
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verify Your Email
                  </h1>
                  <p className="text-gray-600 text-sm">
                    We&apos;ve sent a 6-digit code to{' '}
                    <span className="font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <Input
                    label="Verification Code"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    required
                  />

                  {error && (
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Verify & Continue
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSkipVerification}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Skip for now (demo mode)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('register')}
                    className="w-full text-sm text-[#1e3a5f] hover:underline"
                  >
                    Use a different email
                  </button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-xs mt-6">
          By registering, you agree to the auction terms and conditions.
        </p>
      </div>
    </main>
  )
}
