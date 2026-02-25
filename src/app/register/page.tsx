'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { ArrowLeft, MessageCircle } from 'lucide-react'

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
          currentStep >= 1 ? 'bg-[#c9a227] text-white shadow-lg shadow-[#c9a227]/30' : 'bg-gray-200 text-gray-500'
        }`}>
          1
        </div>
        <span className={`text-sm font-medium transition-colors duration-300 ${
          currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
        }`}>Register</span>
      </div>

      {/* Connector */}
      <div className="w-16 h-0.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full bg-[#c9a227] rounded-full transition-all duration-700 ease-out ${
          currentStep >= 2 ? 'w-full' : 'w-0'
        }`} style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
          currentStep >= 2 ? 'bg-[#c9a227] text-white shadow-lg shadow-[#c9a227]/30' : 'bg-gray-200 text-gray-500'
        }`}>
          2
        </div>
        <span className={`text-sm font-medium transition-colors duration-300 ${
          currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
        }`}>Verify</span>
      </div>
    </div>
  )
}

function OTPInput({ value, onChange, onComplete }: {
  value: string
  onChange: (val: string) => void
  onComplete: (code: string) => void
}) {
  const hiddenRef = useRef<HTMLInputElement>(null)
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  // Hidden input handles iOS autofill (autoComplete="one-time-code" only works on a single input)
  const handleHiddenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6)
    onChange(raw)
    if (raw.length === 6) {
      onComplete(raw)
    }
  }, [onChange, onComplete])

  const handleBoxClick = useCallback(() => {
    hiddenRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }, [value, onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      onChange(pastedData)
      if (pastedData.length === 6) {
        onComplete(pastedData)
      }
    }
  }, [onChange, onComplete])

  return (
    <div className="relative">
      {/* Hidden input for iOS OTP autofill */}
      <input
        ref={hiddenRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={value}
        onChange={handleHiddenChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 z-10"
        maxLength={6}
      />
      {/* Visible digit boxes */}
      <div className="flex justify-center gap-2.5" onClick={handleBoxClick}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 cursor-text ${
              digits[i]?.trim()
                ? 'border-[#c9a227] bg-[#c9a227]/5 text-[#1e3a5f] shadow-sm shadow-[#c9a227]/20'
                : i === value.length
                ? 'border-[#c9a227] bg-white text-gray-900 shadow-sm shadow-[#c9a227]/20'
                : 'border-gray-200 bg-white text-gray-900'
            }`}
          >
            {digits[i]?.trim() || ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [verificationChannel, setVerificationChannel] = useState<'email' | 'sms' | 'console'>('email')
  const [mounted, setMounted] = useState(false)

  const [countryCode, setCountryCode] = useState('+852')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tableNumber: '',
  })

  const [verificationCode, setVerificationCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `${countryCode}${formData.phone.replace(/^0+/, '')}`,
          tableNumber: formData.tableNumber || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      if (!data.requiresVerification) {
        // Already verified — check onboarding
        const onboarded = typeof window !== 'undefined' && localStorage.getItem('rgs_onboarded')
        router.push(onboarded ? '/prizes' : '/welcome')
        return
      }

      setVerificationChannel(data.verificationChannel || 'email')
      setStep('verify')
      setResendCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `${countryCode}${formData.phone.replace(/^0+/, '')}`,
          tableNumber: formData.tableNumber || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code')
      }

      setResendCooldown(60)
      setVerificationCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  const handleVerify = async (code?: string) => {
    const codeToVerify = code || verificationCode
    if (codeToVerify.length !== 6) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(formData.phone ? { phone: formData.phone } : {}),
          ...(formData.email ? { email: formData.email } : {}),
          code: codeToVerify,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      const onboarded = typeof window !== 'undefined' && localStorage.getItem('rgs_onboarded')
      router.push(onboarded ? '/prizes' : '/welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    handleVerify()
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

        {/* Step Indicator */}
        <StepIndicator currentStep={step === 'register' ? 1 : 2} />

        <div>
          {/* Register Step */}
          {step === 'register' && (
          <div className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Register to Bid
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Enter your details to start bidding on exclusive prizes
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '50ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <Input
                      label="Full Name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '100ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <div className="w-full">
                        <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-[#1e3a5f]" />
                          Phone Number
                        </label>
                        <div className="flex gap-2">
                          <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                          <input
                            id="phone-number"
                            type="tel"
                            placeholder="6875 0112"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value.replace(/[^\d\s]/g, '') })
                            }
                            required
                            className="flex-1 px-4 py-2.5 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent placeholder:text-gray-400 border-gray-300 hover:border-gray-400"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">We&apos;ll send a verification code via SMS</p>
                      </div>
                    </div>

                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '150ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <Input
                        label="Email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        hint="We'll send a verification code to your email"
                        required
                      />
                    </div>

                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '200ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <Input
                      label="Table Number (Optional)"
                      placeholder="e.g., 12"
                      value={formData.tableNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, tableNumber: e.target.value.replace(/\D/g, '') })
                      }
                      hint="You can add this later once you're seated"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  )}

                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ transitionDelay: '250ms', transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      className="w-full"
                      isLoading={isLoading}
                    >
                      Continue
                    </Button>
                    {isLoading && (
                      <p className="text-sm text-gray-500 text-center mt-3 animate-pulse">
                        Sending verification code...
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Verify Step */}
          {step === 'verify' && (
          <div className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Enter Verification Code
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {verificationChannel === 'email' ? (
                      <>We&apos;ve sent a 6-digit code to{' '}
                      <span className="font-medium">{formData.email}</span></>
                    ) : verificationChannel === 'sms' ? (
                      <>We&apos;ve sent a 6-digit code via SMS to{' '}
                      <span className="font-medium">{countryCode} {formData.phone}</span></>
                    ) : (
                      <>Check the console for your verification code</>
                    )}
                  </p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-6">
                  <OTPInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    onComplete={(code) => handleVerify(code)}
                  />

                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-2">
                      Codes typically arrive within 30 seconds. Check spam if needed.
                    </p>
                    {resendCooldown > 0 ? (
                      <p className="text-xs text-gray-400">
                        Resend code in {resendCooldown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendLoading}
                        className="text-xs text-[#c9a227] hover:text-[#a08a1e] font-medium disabled:opacity-50"
                      >
                        {resendLoading ? 'Sending...' : "Didn't receive a code? Resend"}
                      </button>
                    )}
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={verificationCode.length !== 6}
                  >
                    Verify & Continue
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('register')
                      setVerificationCode('')
                      setError('')
                    }}
                    className="w-full text-sm text-[#1e3a5f] hover:underline"
                  >
                    Go back and edit details
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          By registering, you agree to the auction terms and conditions.
        </p>
      </div>
    </main>
  )
}
