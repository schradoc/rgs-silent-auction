'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel, Bell, Hash, ChevronRight, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui'

const SCREENS = [
  {
    icon: Gavel,
    title: 'Welcome to the RGS Silent Auction!',
    description:
      'Browse exclusive prizes, place bids from your phone, and win incredible experiences — all during tonight\'s gala.',
    details: [
      'Tap any prize to see details and place a bid',
      'Quick bid buttons let you bid in one tap',
      'You can bid on as many prizes as you like',
    ],
  },
  {
    icon: Bell,
    title: 'Stay in the loop',
    description:
      'Get notified instantly when you\'re outbid so you can bid again before the auction closes.',
    details: [
      'SMS or email alerts when someone outbids you',
      'Notification when you win a prize',
      'Check "My Bids" anytime to see your status',
    ],
  },
  {
    icon: Hash,
    title: 'Add your table number',
    description:
      'This helps organisers identify winners more easily. You can skip this and add it later from your profile.',
    isTableStep: true,
  },
] as const

export default function WelcomePage() {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(0)
  const [tableNumber, setTableNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const screen = SCREENS[currentScreen]
  const isLast = currentScreen === SCREENS.length - 1
  const Icon = screen.icon

  const completeOnboarding = () => {
    try {
      localStorage.setItem('rgs_onboarded', 'true')
    } catch {}
  }

  const handleNext = async () => {
    if (isLast) {
      // Save table number if entered
      if (tableNumber.trim()) {
        setSaving(true)
        try {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNumber: tableNumber.trim() }),
          })
        } catch {}
        setSaving(false)
      }
      completeOnboarding()
      router.push('/prizes')
    } else {
      setCurrentScreen(currentScreen + 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
    router.push('/prizes')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentScreen
                  ? 'w-6 h-2 bg-[#c9a227]'
                  : i < currentScreen
                  ? 'w-2 h-2 bg-[#c9a227]/50'
                  : 'w-2 h-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#c9a227]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-[#c9a227]" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">{screen.title}</h1>
            <p className="text-white/60 text-sm leading-relaxed">{screen.description}</p>
          </div>

          {/* Details list */}
          {'details' in screen && screen.details && (
            <div className="space-y-3 mb-6">
              {screen.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-3 h-3 text-[#c9a227]" />
                  </div>
                  <p className="text-white/70 text-sm">{detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table number input */}
          {'isTableStep' in screen && screen.isTableStep && (
            <div className="mb-6">
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g., 12"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] text-center text-lg"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              variant="gold"
              className="w-full py-3"
              onClick={handleNext}
              disabled={saving}
            >
              {saving ? 'Saving...' : isLast ? (
                <span className="flex items-center justify-center gap-2">
                  <PartyPopper className="w-4 h-4" />
                  Start Bidding
                </span>
              ) : 'Next'}
            </Button>

            <button
              onClick={handleSkip}
              className="w-full py-2 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          RGS-HK 30th Anniversary Gala
        </p>
      </div>
    </main>
  )
}
