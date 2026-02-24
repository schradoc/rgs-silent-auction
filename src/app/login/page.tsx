'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Phone,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Check,
  MessageCircle,
} from 'lucide-react'
import { CountryCodeSelect } from '@/components/ui/country-code-select'

type LoginMethod = 'phone' | 'email'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#b8941f]/30 border-t-[#b8941f] rounded-full animate-spin" />
    </main>
  )
}

function LoginPageContent() {
  const [method, setMethod] = useState<LoginMethod>('phone')
  const [countryCode, setCountryCode] = useState('+852')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const [step, setStep] = useState<'input' | 'otp' | 'sent'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const hiddenOtpRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)

    // Check for error in URL
    const urlError = searchParams.get('error')
    if (urlError === 'invalid_token') {
      setError('Invalid login link. Please request a new one.')
    } else if (urlError === 'expired_token') {
      setError('Login link has expired. Please request a new one.')
    }
  }, [searchParams])

  const handleSendMagicLink = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.notFound) {
          setError('No account found. Please register first.')
        } else {
          setError(data.error || 'Failed to send magic link')
        }
        return
      }

      setStep('sent')
    } catch (err) {
      setError('Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone.replace(/^0+/, '')}`, channel: 'SMS' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setStep('otp')
      setTimeout(() => hiddenOtpRef.current?.focus(), 100)
    } catch (err) {
      setError('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpHiddenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtpValue(raw)
    setError('')
    if (raw.length === 6) {
      handleVerifyOtp(raw)
    }
  }, [])

  const handleOtpKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      setOtpValue(prev => prev.slice(0, -1))
    }
  }, [])

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otpValue
    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone.replace(/^0+/, '')}`, otp: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid code')
        setOtpValue('')
        hiddenOtpRef.current?.focus()
        return
      }

      router.push('/prizes')
    } catch (err) {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d] flex items-center justify-center p-4">
      <div
        className={`w-full max-w-sm transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-white mb-1">Welcome Back</h1>
          <p className="text-white/50 text-sm">Sign in to continue bidding</p>
        </div>

        {/* Phone SMS OTP — Default */}
        {method === 'phone' && step === 'input' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="block text-white/70 text-sm mb-2">Phone Number</label>
            <div className="flex gap-2 mb-4">
              <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, '')); setError(''); }}
                placeholder="6875 0112"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || !phone}
              className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  Send SMS Code
                </>
              )}
            </button>

            <p className="text-white/40 text-xs text-center mt-4">
              We&apos;ll send a 6-digit code via SMS
            </p>
          </div>
        )}

        {/* OTP Entry */}
        {method === 'phone' && step === 'otp' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <h2 className="text-white text-lg font-medium mb-1">Enter Verification Code</h2>
              <p className="text-white/50 text-sm">
                Sent to {phone} via SMS
              </p>
            </div>

            <div className="relative mb-6">
              {/* Hidden input for iOS OTP autofill */}
              <input
                ref={hiddenOtpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpValue}
                onChange={handleOtpHiddenChange}
                onKeyDown={handleOtpKeyDown}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 z-10"
                maxLength={6}
              />
              {/* Visible digit boxes */}
              <div
                className="flex justify-center gap-2"
                onClick={() => hiddenOtpRef.current?.focus()}
              >
                {Array.from({ length: 6 }).map((_, i) => {
                  const digit = otpValue[i] || ''
                  return (
                    <div
                      key={i}
                      className={`w-11 h-14 flex items-center justify-center text-xl font-bold rounded-xl border-2 transition-all duration-200 cursor-text ${
                        digit
                          ? 'bg-[#b8941f]/20 border-[#b8941f] text-white'
                          : i === otpValue.length
                          ? 'bg-white/5 border-[#b8941f] text-white/50'
                          : 'bg-white/5 border-white/20 text-white/50'
                      }`}
                    >
                      {digit}
                    </div>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={() => handleVerifyOtp()}
              disabled={loading || otpValue.length !== 6}
              className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <button
              onClick={() => { setStep('input'); setOtpValue(''); }}
              className="w-full text-white/50 text-sm mt-4 hover:text-white"
            >
              Use a different number
            </button>
          </div>
        )}

        {/* Email Magic Link (fallback) */}
        {method === 'email' && step === 'input' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="block text-white/70 text-sm mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f] mb-4"
            />

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleSendMagicLink}
              disabled={loading || !email}
              className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Send Magic Link
                </>
              )}
            </button>

            <p className="text-white/40 text-xs text-center mt-4">
              We&apos;ll email you a link to sign in instantly
            </p>
          </div>
        )}

        {/* Magic Link Sent */}
        {method === 'email' && step === 'sent' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-white text-xl font-medium mb-2">Check Your Email</h2>
            <p className="text-white/50 text-sm mb-6">
              We sent a magic link to <span className="text-white">{email}</span>
            </p>
            <button
              onClick={() => { setStep('input'); setEmail(''); }}
              className="text-[#b8941f] text-sm hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          {method === 'email' && step === 'input' && (
            <button
              onClick={() => { setMethod('phone'); setError(''); }}
              className="block w-full text-white/40 text-sm hover:text-white/60"
            >
              Sign in with phone instead
            </button>
          )}
          {method === 'phone' && step === 'input' && (
            <button
              onClick={() => { setMethod('email'); setError(''); }}
              className="block w-full text-white/40 text-sm hover:text-white/60"
            >
              Sign in with email instead
            </button>
          )}
          <Link href="/register" className="block text-[#b8941f] text-sm hover:underline">
            Don&apos;t have an account? Register
          </Link>
          <Link href="/prizes" className="block text-white/40 text-sm hover:text-white/60">
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  )
}
