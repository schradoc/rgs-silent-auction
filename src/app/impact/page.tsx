'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ArrowRight,
  GraduationCap,
  School,
  Award,
  Globe,
  Heart,
  Quote,
} from 'lucide-react'
import { Header } from '@/components/layout/header'

/* ------------------------------------------------------------------ */
/*  Intersection Observer hook for scroll-triggered animations         */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Impact area data                                                    */
/* ------------------------------------------------------------------ */

const IMPACT_AREAS = [
  {
    icon: GraduationCap,
    title: 'Scholarship Fund',
    established: 'Established 1997',
    description:
      'Supports geography undergraduates and masters\u2019 students at HKU, CUHK, and Hong Kong Baptist University \u2014 specifically funding the fieldwork element of dissertations that takes students out of the classroom and into the field.',
    stats: [
      { value: '3', label: 'Universities' },
      { value: '29', label: 'Years Running' },
    ],
  },
  {
    icon: School,
    title: 'Schools Outreach Programme',
    established: 'Established 2012',
    description:
      'Bringing the spirit of exploration directly into classrooms across Hong Kong. Volunteer speakers visit local schools, international schools, and ESF schools to inspire the next generation of geographers.',
    stats: [
      { value: '~35', label: 'Talks / Year' },
      { value: '5,600+', label: 'Pupils Reached' },
    ],
  },
  {
    icon: Award,
    title: 'Young Geographer Awards',
    established: 'Annual Competition',
    description:
      'An annual competition open to students ages 6 to 23, drawing thousands of entries from 43+ schools across Hong Kong. Winners receive cash prizes, RGS memberships, and public exhibition of their work.',
    stats: [
      { value: '43+', label: 'Schools' },
      { value: '~25', label: 'Winners / Year' },
    ],
  },
  {
    icon: Globe,
    title: 'Research Grants',
    established: 'Major Award Since 2002',
    description:
      'The Major Post-Graduate Award funds advanced geographical research in the greater China region, supporting the scholars whose work deepens our understanding of the world. Annual surplus is donated to further geographical research.',
    stats: [
      { value: '24', label: 'Years of Grants' },
      { value: 'HK/China', label: 'Focus Region' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function ImpactPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cardsSection = useInView(0.1)
  const quoteSection = useInView()

  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative bg-[#0f1d2d] overflow-hidden">
        {/* Animated background blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#a08a1e]/8 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: '10s' }}
          />
          <div
            className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-[#1a3a5c]/40 rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: '14s' }}
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
              <Heart className="w-4 h-4 text-[#a08a1e]" />
              <span className="text-[#a08a1e] text-sm font-medium">
                Make an Impact
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-extralight text-white mb-6 tracking-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Your Bid Makes a Difference
            </h1>

            <p
              className={`text-lg md:text-xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Every lot in tonight&rsquo;s auction supports geographical
              education, research, and conservation across Hong Kong and the
              greater China region.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  IMPACT AREAS                                                 */}
      {/* ============================================================ */}
      <section className="px-6 py-20 md:py-28">
        <div ref={cardsSection.ref} className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {IMPACT_AREAS.map((area, i) => {
              const Icon = area.icon
              return (
                <div
                  key={area.title}
                  className={`bg-white rounded-3xl p-8 shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-1 ${cardsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  {/* Icon + badge row */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#a08a1e]/15 to-[#a08a1e]/5 flex items-center justify-center border border-[#a08a1e]/15">
                      <Icon className="w-6 h-6 text-[#a08a1e]" />
                    </div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full">
                      {area.established}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-xl font-medium text-[#1a2f4a] mb-3">
                    {area.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm mb-6">
                    {area.description}
                  </p>

                  {/* Stats row */}
                  <div className="flex gap-6 pt-5 border-t border-gray-100">
                    {area.stats.map((stat) => (
                      <div key={stat.label}>
                        <p className="text-xl font-light text-[#a08a1e]">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  QUOTE / CTA                                                  */}
      {/* ============================================================ */}
      <section className="px-6 py-20 md:py-28 bg-[#0f1d2d]">
        <div
          ref={quoteSection.ref}
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${quoteSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Decorative quote icon */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#a08a1e]/10 flex items-center justify-center border border-[#a08a1e]/20">
              <Quote className="w-6 h-6 text-[#a08a1e]" />
            </div>
          </div>

          <blockquote className="text-xl md:text-2xl font-light text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto">
            &ldquo;For three decades, RGS-HK has nurtured the next generation
            of geographers and explorers. Tonight, your generosity continues
            that legacy.&rdquo;
          </blockquote>

          {/* Gold accent line */}
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#a08a1e] to-transparent mx-auto mb-10" />

          <Link href="/prizes">
            <Button
              variant="gold"
              size="lg"
              className="group animate-pulse-gold transition-all"
            >
              <span>Browse Auction Lots</span>
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <p className="mt-6 text-white/30 text-sm">
            All proceeds support geographical education and research in Hong
            Kong
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-[#0f1d2d] border-t border-white/5 px-6 py-8 text-center">
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
