'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronDown,
  Gavel,
  UserPlus,
  TrendingUp,
  Trophy,
  Bell,
  HelpCircle,
  Clock,
  CreditCard,
} from 'lucide-react'

const HOW_IT_WORKS_STEPS = [
  {
    icon: UserPlus,
    title: 'Register',
    description: 'Enter your name and email. We\'ll send you a verification code to confirm your identity.',
  },
  {
    icon: Gavel,
    title: 'Browse & Bid',
    description: 'Explore the prizes and place bids. Each bid must meet the minimum next bid amount.',
  },
  {
    icon: Bell,
    title: 'Get Notified',
    description: 'If someone outbids you, you\'ll receive an email alert so you can bid again.',
  },
  {
    icon: Trophy,
    title: 'Win',
    description: 'When the auction closes, the highest bidder on each prize wins. You\'ll be notified by email.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'How do bid increments work?',
    answer: 'The minimum bid increment depends on the current highest bid:\n\n- Under HK$10,000 — increment is HK$500\n- HK$10,000 to HK$29,999 — increment is HK$1,000\n- HK$30,000 to HK$49,999 — increment is HK$2,000\n- HK$50,000 and above — increment is HK$5,000\n\nYou can always bid more than the minimum.',
  },
  {
    question: 'What happens if I get outbid?',
    answer: 'You\'ll receive an email notification with the new highest bid amount. You can then return to the prize and place a higher bid. Outbid alerts are sent in real-time so you have the best chance to respond.',
  },
  {
    question: 'Can I bid on multiple prizes?',
    answer: 'Yes! You can bid on as many prizes as you like. Check "My Bids" to see all your active bids and which ones you\'re currently winning.',
  },
  {
    question: 'What are Pledges?',
    answer: 'Pledges are donation tiers (Bronze, Silver, Gold, Platinum) where multiple people can contribute. Unlike competitive prizes, pledges don\'t get outbid — each pledge is a separate contribution to support the cause.',
  },
  {
    question: 'When does the auction close?',
    answer: 'The auction closing time is displayed on the prizes page. All bids must be placed before the closing time. There is no extension — once the auction closes, the highest bids win.',
  },
  {
    question: 'How will I know if I won?',
    answer: 'Winners are notified by email after the auction closes and results are confirmed. You can also check "My Bids" for the latest status of all your bids.',
  },
  {
    question: 'How do I collect my prize?',
    answer: 'Prize collection details will be communicated by the event organizers after the auction. Most prizes will be available for collection at the event or arranged for delivery.',
  },
  {
    question: 'Can I cancel a bid?',
    answer: 'Bids are binding commitments and cannot be cancelled. Please bid carefully and only on prizes you genuinely want to win.',
  },
  {
    question: 'What if I can\'t attend the event?',
    answer: 'You can still bid remotely! The auction is fully accessible from your phone or computer. You don\'t need to be at the event to place bids.',
  },
  {
    question: 'Who can I contact for help?',
    answer: 'If you need assistance during the event, please speak to one of the event helpers or contact the organizers at the registration desk.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
      >
        <span className="font-medium text-[#1a1a1a] group-hover:text-[#0f1d2d] transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#6b6b6b] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-5 px-1">
          <p className="text-[#6b6b6b] text-sm leading-relaxed whitespace-pre-line">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/prizes"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Prizes</span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#a08a1e]/10 mb-4">
            <HelpCircle className="w-7 h-7 text-[#a08a1e]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1a1a1a] tracking-tight">
            How It Works
          </h1>
          <p className="text-[#6b6b6b] mt-2">
            Everything you need to know about bidding
          </p>
        </div>

        {/* How It Works Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#a08a1e]/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-[#a08a1e]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#a08a1e] font-semibold">Step {i + 1}</span>
                  </div>
                  <h3 className="font-medium text-[#1a1a1a] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#6b6b6b] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bid Increments Quick Reference */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#a08a1e]" />
            <h2 className="text-lg font-medium text-[#1a1a1a]">Bid Increment Guide</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { range: 'Under HK$10k', increment: '+HK$500' },
              { range: 'HK$10k–30k', increment: '+HK$1,000' },
              { range: 'HK$30k–50k', increment: '+HK$2,000' },
              { range: 'HK$50k+', increment: '+HK$5,000' },
            ].map((tier) => (
              <div key={tier.range} className="bg-[#f8f8f6] rounded-xl p-3">
                <p className="text-xs text-[#6b6b6b]">{tier.range}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{tier.increment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-[#a08a1e]" />
            <h2 className="text-lg font-medium text-[#1a1a1a]">Key Information</h2>
          </div>
          <ul className="space-y-3 text-sm text-[#6b6b6b]">
            <li className="flex gap-2">
              <span className="text-[#a08a1e] font-bold">-</span>
              All bids are binding commitments
            </li>
            <li className="flex gap-2">
              <span className="text-[#a08a1e] font-bold">-</span>
              The highest bid when the auction closes wins
            </li>
            <li className="flex gap-2">
              <span className="text-[#a08a1e] font-bold">-</span>
              Winners are notified by email
            </li>
            <li className="flex gap-2">
              <span className="text-[#a08a1e] font-bold">-</span>
              All proceeds support RGS-HK Schools Outreach
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-medium text-[#1a1a1a] mb-2">Frequently Asked Questions</h2>
          <div>
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-8">
          <Link
            href="/prizes"
            className="inline-flex items-center gap-2 bg-[#a08a1e] hover:bg-[#8a7618] text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            <Gavel className="w-4 h-4" />
            Start Bidding
          </Link>
        </div>
      </div>
    </main>
  )
}
