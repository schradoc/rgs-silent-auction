'use client'

import { useState, useEffect } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Users,
  Settings,
  Rocket,
  Gavel,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: typeof Trophy
  targetTab?: 'overview' | 'prizes' | 'bidders' | 'winners' | 'helpers' | 'settings'
  highlight?: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RGS-HK Admin',
    description:
      'This dashboard lets you manage your silent auction. Let\'s walk through the key features.',
    icon: Gavel,
  },
  {
    id: 'prizes',
    title: 'Manage Prizes',
    description:
      'Add, edit, and track all auction prizes. You can see current bids and bid counts at a glance.',
    icon: Trophy,
    targetTab: 'prizes',
  },
  {
    id: 'bidders',
    title: 'Monitor Bidders',
    description:
      'See who has registered, their table numbers, and how many bids they\'ve placed.',
    icon: Users,
    targetTab: 'bidders',
  },
  {
    id: 'settings',
    title: 'Auction States',
    description:
      'Control your auction lifecycle: Draft → Testing → Pre-launch → Live → Closed. Each state changes what bidders can see and do.',
    icon: Settings,
    targetTab: 'settings',
  },
  {
    id: 'launch',
    title: 'Ready to Launch!',
    description:
      'When you\'re ready, change the state to "Live" to open bidding. Good luck with your auction!',
    icon: Rocket,
  },
]

interface OnboardingTutorialProps {
  onClose: () => void
  onTabChange: (tab: 'overview' | 'prizes' | 'bidders' | 'winners' | 'helpers' | 'settings') => void
}

export function OnboardingTutorial({ onClose, onTabChange }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const step = ONBOARDING_STEPS[currentStep]
  const Icon = step.icon
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1
  const isFirstStep = currentStep === 0

  useEffect(() => {
    if (step.targetTab) {
      onTabChange(step.targetTab)
    }
  }, [currentStep, step.targetTab, onTabChange])

  const handleNext = () => {
    if (isLastStep) {
      onClose()
      return
    }
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
      setIsAnimating(false)
    }, 150)
  }

  const handlePrev = () => {
    if (isFirstStep) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1)
      setIsAnimating(false)
    }, 150)
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleSkip} />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-4 mb-0 sm:mb-0 transform transition-all duration-150 ${
          isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-[#1e3a5f] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{step.title}</h2>
          <p className="text-gray-600 text-center mb-6">{step.description}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-[#c9a227] w-6'
                    : index < currentStep
                    ? 'bg-[#c9a227]/40'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button variant="outline" className="flex-1" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            {isFirstStep && (
              <Button variant="ghost" className="flex-1" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            <Button variant="gold" className="flex-1" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true)

  useEffect(() => {
    const seen = localStorage.getItem('admin_onboarding_completed')
    if (!seen) {
      setHasSeenOnboarding(false)
      setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem('admin_onboarding_completed', 'true')
    setShowOnboarding(false)
    setHasSeenOnboarding(true)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('admin_onboarding_completed')
    setHasSeenOnboarding(false)
    setShowOnboarding(true)
  }

  return {
    showOnboarding,
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding,
    startOnboarding: () => setShowOnboarding(true),
  }
}
