'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
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

type LoginMethod = 'email' | 'phone'
type OtpChannel = 'SMS' | 'WHATSAPP'

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
  const [method, setMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('SMS')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'input' | 'otp' | 'sent'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

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
        setError(data.error || 'Failed to send magic link')
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
        body: JSON.stringify({ phone, channel: otpChannel }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setStep('otp')
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    } catch (err) {
      setError('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullOtp = [...newOtp.slice(0, 5), value.slice(-1)].join('')
      if (fullOtp.length === 6) {
        handleVerifyOtp(fullOtp)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
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
        body: JSON.stringify({ phone, otp: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid code')
        setOtp(['', '', '', '', '', ''])
        otpRefs[0].current?.focus()
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

        {/* Method Tabs */}
        {step === 'input' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMethod('email'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                method === 'email'
                  ? 'bg-[#b8941f] text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => { setMethod('phone'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                method === 'phone'
                  ? 'bg-[#b8941f] text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>
        )}

        {/* Email Magic Link */}
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
              We'll email you a link to sign in instantly
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

        {/* Phone OTP */}
        {method === 'phone' && step === 'input' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="block text-white/70 text-sm mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              placeholder="+852 9123 4567"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8941f] mb-4"
            />

            <label className="block text-white/70 text-sm mb-2">Send code via</label>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setOtpChannel('SMS')}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                  otpChannel === 'SMS'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                SMS
              </button>
              <button
                onClick={() => setOtpChannel('WHATSAPP')}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                  otpChannel === 'WHATSAPP'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
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
                  <Sparkles className="w-5 h-5" />
                  Send Verification Code
                </>
              )}
            </button>
          </div>
        )}

        {/* OTP Entry */}
        {method === 'phone' && step === 'otp' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <h2 className="text-white text-lg font-medium mb-1">Enter Verification Code</h2>
              <p className="text-white/50 text-sm">
                Sent to {phone} via {otpChannel}
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={loading}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    digit
                      ? 'bg-[#b8941f]/20 border-[#b8941f] text-white'
                      : 'bg-white/5 border-white/20 text-white/50 focus:border-[#b8941f]'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some(d => !d)}
              className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <button
              onClick={() => { setStep('input'); setOtp(['', '', '', '', '', '']); }}
              className="w-full text-white/50 text-sm mt-4 hover:text-white"
            >
              Use a different number
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <Link href="/register" className="block text-[#b8941f] text-sm hover:underline">
            Don't have an account? Register
          </Link>
          <Link href="/prizes" className="block text-white/40 text-sm hover:text-white/60">
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  )
}
