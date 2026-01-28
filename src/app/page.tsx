import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { SITE_CONFIG } from '@/lib/constants'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#1e3a5f]">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-repeat" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md w-full text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[#1e3a5f] font-bold text-sm">RGS-HK</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Silent Auction
          </h1>
          <p className="text-[#c9a227] text-lg font-medium mb-4">
            30th Anniversary Gala Dinner
          </p>

          {/* Event Details */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-8">
            <p className="text-white/80 text-sm mb-1">
              {SITE_CONFIG.eventVenue}
            </p>
            <p className="text-white font-medium">
              28 February 2026 • 6:30pm - 11:00pm
            </p>
          </div>

          {/* Description */}
          <p className="text-white/70 mb-8 text-sm leading-relaxed">
            Bid on exclusive experiences, luxury travel, and historic artifacts.
            All proceeds support RGS-HK&apos;s Schools Outreach Programme.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link href="/register" className="block">
              <Button variant="gold" size="lg" className="w-full">
                Register to Bid
              </Button>
            </Link>
            <Link href="/prizes" className="block">
              <Button variant="outline" size="lg" className="w-full border-white text-white hover:bg-white hover:text-[#1e3a5f]">
                Browse Prizes
              </Button>
            </Link>
          </div>

          {/* Already Registered */}
          <p className="mt-6 text-white/60 text-sm">
            Already registered?{' '}
            <Link href="/prizes" className="text-[#c9a227] hover:underline">
              View prizes
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/40 text-xs">
            Royal Geographical Society - Hong Kong
          </p>
        </div>
      </div>
    </main>
  )
}
