import Link from 'next/link'
import { Button } from '@/components/ui'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#1a2f4a] relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#b8941f]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#b8941f]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                <span className="text-white/90 text-xs font-semibold tracking-wide">RGS</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          <div className="max-w-lg w-full text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8 animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-[#b8941f] animate-glow" />
              <span className="text-white/70 text-sm font-medium tracking-wide">30th Anniversary</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Silent Auction
            </h1>

            <p className="text-lg md:text-xl text-[#b8941f] font-medium mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Royal Geographical Society Hong Kong
            </p>

            {/* Event details card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-10 border border-white/10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#b8941f]" />
                  <div className="text-left">
                    <p className="text-sm text-white/50">Date</p>
                    <p className="font-medium">28 February 2026</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#b8941f]" />
                  <div className="text-left">
                    <p className="text-sm text-white/50">Venue</p>
                    <p className="font-medium">Hong Kong Club</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-white/60 mb-10 text-base leading-relaxed max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              Bid on exclusive experiences, luxury travel, and historic artifacts.
              All proceeds support our Schools Outreach Programme.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <Link href="/register">
                <Button variant="gold" size="lg" className="w-full sm:w-auto min-w-[200px] group btn-press">
                  <span>Register to Bid</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/prizes">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px] border-white/20 text-white hover:bg-white/10 hover:border-white/30 btn-press"
                >
                  Browse Prizes
                </Button>
              </Link>
            </div>

            {/* Already registered */}
            <p className="mt-8 text-white/40 text-sm animate-fade-in" style={{ animationDelay: '600ms' }}>
              Already registered?{' '}
              <Link href="/prizes" className="text-[#b8941f] hover:text-[#d4b23a] transition-colors">
                View your bids
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center animate-fade-in" style={{ animationDelay: '700ms' }}>
          <p className="text-white/30 text-xs tracking-wide">
            Est. 1994 • Hong Kong
          </p>
        </footer>
      </div>
    </main>
  )
}
