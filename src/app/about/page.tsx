'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ArrowRight,
  Calendar,
  MapPin,
  Sparkles,
  Globe,
  BookOpen,
  Users,
} from 'lucide-react'
import { Header } from '@/components/layout/header'

/* ------------------------------------------------------------------ */
/*  Metadata is handled via a separate layout or generateMetadata      */
/*  in server components. For now this is a pure client page.          */
/* ------------------------------------------------------------------ */

const DISTINGUISHED_SPEAKERS = [
  { name: 'Dame Jane Goodall', title: 'Primatologist & Conservationist' },
  { name: 'Sir Ranulph Fiennes', title: 'Polar Explorer' },
  { name: 'Sir Chris Bonington', title: 'Mountaineer' },
  { name: 'Benedict Allen', title: 'Explorer & Filmmaker' },
  { name: 'William Dalrymple', title: 'Author & Historian' },
  { name: 'Wong How Man', title: 'China Exploration & Research' },
  { name: 'Levison Wood', title: 'Explorer & Author' },
  { name: 'Sarah Outen', title: 'Adventurer & Author' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

export default function AboutPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const statsSection = useInView()
  const storySection = useInView()
  const speakersSection = useInView()
  const eventSection = useInView()

  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative bg-[#0f1d2d] overflow-hidden">
        {/* Animated background blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#a08a1e]/8 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#1a3a5c]/40 rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: '12s' }}
          />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10">
          <Header transparent />

          <div className="px-6 pt-8 pb-24 md:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#a08a1e]/20 to-[#a08a1e]/10 border border-[#a08a1e]/30 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <Globe className="w-4 h-4 text-[#a08a1e]" />
              <span className="text-[#a08a1e] text-sm font-medium">
                Est. 1995
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-extralight text-white mb-6 tracking-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Three Decades of Discovery
            </h1>

            <p
              className={`text-lg md:text-xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Since 1995, the Royal Geographical Society &ndash; Hong Kong has
              connected Hong Kong with the world&rsquo;s greatest explorers,
              geographers, and adventurers.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS ROW                                                    */}
      {/* ============================================================ */}
      <section className="relative -mt-12 z-20 px-6">
        <div
          ref={statsSection.ref}
          className="max-w-3xl mx-auto grid grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { number: '30', label: 'Years' },
            { number: '2,500+', label: 'Members' },
            { number: '120+', label: 'Events / Year' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl p-5 md:p-6 text-center shadow-lg border border-gray-100 transition-all duration-700 ${statsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p className="text-3xl md:text-4xl font-light text-[#a08a1e] mb-1">
                {stat.number}
              </p>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  OUR STORY                                                    */}
      {/* ============================================================ */}
      <section className="px-6 py-20 md:py-28">
        <div
          ref={storySection.ref}
          className={`max-w-3xl mx-auto transition-all duration-700 ${storySection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-5 h-5 text-[#a08a1e]" />
            <h2 className="text-sm font-medium text-[#a08a1e] uppercase tracking-widest">
              Our Story
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <h3 className="text-2xl md:text-3xl font-light text-[#1a2f4a] mb-8 leading-snug">
              The first overseas branch of one of the world&rsquo;s most
              prestigious learned societies.
            </h3>

            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                Founded in 1995, the Royal Geographical Society &ndash; Hong
                Kong is the first overseas branch of the Royal Geographical
                Society in London, which itself was established in 1830. Today,
                RGS-HK stands as the largest English-medium society in Hong
                Kong.
              </p>

              <p>
                The Society provides a forum for members to meet and listen to
                leading local and international speakers across geography,
                history, exploration, travel, research, Asian studies, and
                conservation. With more than 120 events per year, there is
                always an opportunity to discover something extraordinary.
              </p>

              <p>
                The Honorary Patron of the Society is the British Consul General
                in Hong Kong &ndash; a tradition that underscores the deep ties
                between RGS-HK and the parent society in London.
              </p>

              <div className="mt-8 p-6 bg-[#f8f8f6] rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#a08a1e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-[#a08a1e]" />
                  </div>
                  <div>
                    <p className="text-[#1a2f4a] font-medium mb-1">
                      A Global Connection
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Hong Kong members enjoy access to the RGS London
                      Members&rsquo; reading library and a dedicated
                      &ldquo;Hong Kong Room&rdquo; at the Kensington
                      headquarters &ndash; a unique bridge between East and
                      West.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  DISTINGUISHED SPEAKERS                                       */}
      {/* ============================================================ */}
      <section className="bg-[#0f1d2d] px-6 py-20 md:py-28">
        <div ref={speakersSection.ref} className="max-w-4xl mx-auto">
          <div
            className={`flex items-center gap-3 mb-4 transition-all duration-700 ${speakersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <Users className="w-5 h-5 text-[#a08a1e]" />
            <h2 className="text-sm font-medium text-[#a08a1e] uppercase tracking-widest">
              Distinguished Speakers
            </h2>
          </div>

          <p
            className={`text-white/50 font-light text-lg mb-12 max-w-xl transition-all duration-700 delay-100 ${speakersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            Over three decades, RGS-HK has hosted some of the world&rsquo;s
            most remarkable explorers, scientists, and storytellers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DISTINGUISHED_SPEAKERS.map((speaker, i) => (
              <div
                key={speaker.name}
                className={`bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all duration-700 hover:bg-white/10 hover:border-[#a08a1e]/30 hover:shadow-lg hover:shadow-[#a08a1e]/5 ${speakersSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${150 + i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#a08a1e]/20 to-[#a08a1e]/5 flex items-center justify-center mb-4 border border-[#a08a1e]/20">
                  <span className="text-[#a08a1e] text-sm font-medium">
                    {speaker.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                </div>
                <p className="text-white font-medium text-sm mb-1">
                  {speaker.name}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">
                  {speaker.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TONIGHT'S EVENT                                              */}
      {/* ============================================================ */}
      <section className="px-6 py-20 md:py-28 bg-[#f8f8f6]">
        <div
          ref={eventSection.ref}
          className={`max-w-3xl mx-auto transition-all duration-700 ${eventSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="relative bg-gradient-to-br from-[#1a2f4a] to-[#0f1d2d] rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#a08a1e] to-transparent" />

            {/* Decorative blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#a08a1e]/8 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#a08a1e]/15 border border-[#a08a1e]/30 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-[#a08a1e]" />
                <span className="text-[#a08a1e] text-xs font-medium uppercase tracking-wider">
                  Tonight&rsquo;s Event
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-light text-white mb-3">
                30th Anniversary Gala Dinner &amp; Reception
              </h3>

              <p className="text-white/50 font-light mb-6 leading-relaxed max-w-xl">
                Guest of Honour:{' '}
                <span className="text-white/80">
                  Field Marshal the Lord Richards
                </span>
                . Also commemorating the 80th Anniversary of the End of WWII.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-8 text-white/60">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#a08a1e]" />
                  <span className="text-sm">28 February 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#a08a1e]" />
                  <span className="text-sm">The Hong Kong Club</span>
                </div>
              </div>

              <Link href="/prizes">
                <Button
                  variant="gold"
                  size="lg"
                  className="group transition-all"
                >
                  <span>View Auction Lots</span>
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-[#0f1d2d] px-6 py-8 text-center">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-white/20 text-xs">
          <span>Royal Geographical Society Hong Kong</span>
          <span>Est. 1995</span>
        </div>
        <p className="text-white/[0.08] text-xs mt-1">
          Powered by Axiomcasts Limited
        </p>
      </footer>
    </main>
  )
}
