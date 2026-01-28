'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Sparkles } from 'lucide-react'

export default function HelperLoginPage() {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    inputRefs[0].current?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    setError('')

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const fullPin = [...newPin.slice(0, 3), value.slice(-1)].join('')
      if (fullPin.length === 4) {
        handleSubmit(fullPin)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async (pinCode?: string) => {
    const fullPin = pinCode || pin.join('')
    if (fullPin.length !== 4) {
      setError('Please enter your 4-digit PIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/helpers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid PIN')
        setPin(['', '', '', ''])
        inputRefs[0].current?.focus()
        return
      }

      router.push('/helper/dashboard')
    } catch (err) {
      setError('Login failed. Please try again.')
      setPin(['', '', '', ''])
      inputRefs[0].current?.focus()
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b8941f] to-[#d4af37] mb-4 shadow-lg shadow-[#b8941f]/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-light text-white mb-1">Helper Login</h1>
          <p className="text-white/50 text-sm">Enter your 4-digit PIN</p>
        </div>

        {/* PIN Input */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <div className="flex justify-center gap-3 mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                  digit
                    ? 'bg-[#b8941f]/20 border-[#b8941f] text-white'
                    : 'bg-white/5 border-white/20 text-white/50 focus:border-[#b8941f]'
                } ${loading ? 'opacity-50' : ''}`}
              />
            ))}
          </div>

          {error && (
            <div className="text-center text-red-400 text-sm mb-4 animate-shake">
              {error}
            </div>
          )}

          <button
            onClick={() => handleSubmit()}
            disabled={loading || pin.some((d) => !d)}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || pin.some((d) => !d)
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white hover:shadow-lg hover:shadow-[#b8941f]/30 hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Enter Dashboard
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          RGS-HK 30th Anniversary Gala Dinner
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </main>
  )
}
