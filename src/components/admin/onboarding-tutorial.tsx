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
  LayoutDashboard,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: typeof Trophy
  targetTab?: 'overview' | 'prizes' | 'bidders' | 'winners' | 'helpers' | 'settings'
  position: 'center' | 'bottom-left' | 'bottom-right' | 'top-left'
  highlightSelector?: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RGS-HK Admin',
    description:
      'This dashboard lets you manage your silent auction. Let\'s take a quick tour of the key features.',
    icon: Gavel,
    position: 'center',
  },
  {
    id: 'overview',
    title: 'Dashboard Overview',
    description:
      'The overview shows key stats, auction status, analytics, and a live feed of bids as they come in.',
    icon: LayoutDashboard,
    targetTab: 'overview',
    position: 'bottom-right',
  },
  {
    id: 'prizes',
    title: 'Manage Prizes',
    description:
      'Add, edit, and track all auction prizes. Click "Add Prize" to create new items, or click any prize to edit it.',
    icon: Trophy,
    targetTab: 'prizes',
    position: 'bottom-right',
  },
  {
    id: 'bidders',
    title: 'Monitor Bidders',
    description:
      'See who has registered, their table numbers, and their bidding activity.',
    icon: Users,
    targetTab: 'bidders',
    position: 'bottom-right',
  },
  {
    id: 'winners',
    title: 'Confirm Winners',
    description:
      'After the auction closes, use this tab to confirm winners and send notification emails.',
    icon: Award,
    targetTab: 'winners',
    position: 'bottom-right',
  },
  {
    id: 'settings',
    title: 'Auction States',
    description:
      'Control the auction lifecycle: Draft → Testing → Pre-launch → Live → Closed. Change the state when ready to go live!',
    icon: Settings,
    targetTab: 'settings',
    position: 'bottom-left',
  },
  {
    id: 'launch',
    title: 'You\'re All Set!',
    description:
      'Add your prizes, then change the state to "Live" when ready to open bidding. Click the ? button anytime to restart this tour.',
    icon: Rocket,
    position: 'center',
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

  // Position classes based on step
  const getPositionClasses = () => {
    switch (step.position) {
      case 'bottom-left':
        return 'bottom-24 left-4 sm:left-8'
      case 'bottom-right':
        return 'bottom-24 right-4 sm:right-8'
      case 'top-left':
        return 'top-24 left-4 sm:left-8'
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent backdrop - allows seeing the UI */}
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Tooltip/Card */}
      <div
        className={`absolute pointer-events-auto bg-white rounded-2xl shadow-2xl w-80 sm:w-96 transform transition-all duration-200 ${
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${getPositionClasses()}`}
      >
        {/* Arrow indicator for non-center positions */}
        {step.position !== 'center' && (
          <div className={`absolute w-4 h-4 bg-white transform rotate-45 ${
            step.position === 'bottom-left' || step.position === 'bottom-right'
              ? '-top-2 left-8'
              : '-bottom-2 left-8'
          }`} />
        )}

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-5">
          {/* Header with icon */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-[#1e3a5f] rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-[#c9a227] w-6'
                      : index < currentStep
                      ? 'bg-[#c9a227]/40 w-1.5'
                      : 'bg-gray-200 w-1.5'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" size="sm" className="flex-1" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            {isFirstStep && (
              <Button variant="ghost" size="sm" className="flex-1" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button variant="gold" size="sm" className="flex-1" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Done
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
