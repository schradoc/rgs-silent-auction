'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MapPin,
  Calendar,
  Backpack,
  Info,
} from 'lucide-react'

interface Section {
  type: 'paragraph' | 'heading' | 'bullets' | 'itinerary-day' | 'highlight-box'
  heading?: string
  content: string
  items?: string[]
  icon?: 'included' | 'bring' | 'itinerary' | 'info'
}

/**
 * Detects if a line is a section heading.
 * Matches patterns like:
 *   "What's Included:"
 *   "Itinerary"
 *   "What to Bring:"
 *   "Day 1 – Arrival & Street Photography (Porto):"
 */
function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  // Short line ending with colon
  if (trimmed.endsWith(':') && trimmed.length < 80) return true
  // Known standalone headings
  const headingKeywords = ['itinerary', 'overview', 'highlights', 'details', 'schedule', 'program', 'programme']
  if (headingKeywords.includes(trimmed.toLowerCase())) return true
  return false
}

function isBulletLine(line: string): boolean {
  const trimmed = line.trim()
  return /^[•\-\*]\s/.test(trimmed)
}

function isDayEntry(line: string): boolean {
  return /^day\s+\d+/i.test(line.trim())
}

function getHeadingIcon(heading: string): Section['icon'] {
  const lower = heading.toLowerCase()
  if (lower.includes('include') || lower.includes('what you get') || lower.includes('package')) return 'included'
  if (lower.includes('bring') || lower.includes('pack') || lower.includes('prepare') || lower.includes('need')) return 'bring'
  if (lower.includes('itinerary') || lower.includes('schedule') || lower.includes('program')) return 'itinerary'
  return 'info'
}

function parseDescription(text: string): Section[] {
  const lines = text.split('\n')
  const sections: Section[] = []
  let currentSection: Section | null = null
  let paragraphBuffer: string[] = []

  const flushParagraph = () => {
    const text = paragraphBuffer.join('\n').trim()
    if (text) {
      sections.push({ type: 'paragraph', content: text })
    }
    paragraphBuffer = []
  }

  const flushCurrentSection = () => {
    if (currentSection) {
      // If section has bullet items, make it a bullets type
      if (currentSection.items && currentSection.items.length > 0) {
        currentSection.type = 'bullets'
      }
      sections.push(currentSection)
      currentSection = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) {
      if (!currentSection && paragraphBuffer.length > 0) {
        flushParagraph()
      }
      continue
    }

    // Check for day entry (Day 1 – ...)
    if (isDayEntry(trimmed)) {
      flushParagraph()
      flushCurrentSection()

      // Parse the day line: "Day 1 – Title:" or "Day 1 – Title:\nDescription"
      const dayHeading = trimmed.replace(/:$/, '')

      // Collect the description lines after the day heading
      const descLines: string[] = []
      while (i + 1 < lines.length && lines[i + 1].trim() && !isDayEntry(lines[i + 1]) && !isHeading(lines[i + 1])) {
        i++
        descLines.push(lines[i].trim())
      }

      sections.push({
        type: 'itinerary-day',
        heading: dayHeading,
        content: descLines.join(' '),
      })
      continue
    }

    // Check for section heading
    if (isHeading(trimmed)) {
      flushParagraph()
      flushCurrentSection()

      const heading = trimmed.replace(/:$/, '').trim()
      currentSection = {
        type: 'highlight-box',
        heading,
        content: '',
        items: [],
        icon: getHeadingIcon(heading),
      }
      continue
    }

    // Check for bullet line
    if (isBulletLine(trimmed)) {
      if (paragraphBuffer.length > 0) {
        flushParagraph()
      }

      const bulletText = trimmed.replace(/^[•\-\*]\s*/, '').trim()
      if (currentSection) {
        if (!currentSection.items) currentSection.items = []
        currentSection.items.push(bulletText)
      } else {
        // Orphan bullet — create a bullets section
        currentSection = {
          type: 'bullets',
          content: '',
          items: [bulletText],
        }
      }
      continue
    }

    // Regular text line
    if (currentSection) {
      // Add to current section's content
      if (currentSection.content) {
        currentSection.content += ' ' + trimmed
      } else {
        currentSection.content = trimmed
      }
    } else {
      paragraphBuffer.push(trimmed)
    }
  }

  flushParagraph()
  flushCurrentSection()

  return sections
}

const ICON_MAP = {
  included: CheckCircle2,
  bring: Backpack,
  itinerary: Calendar,
  info: Info,
}

const ICON_COLORS = {
  included: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  bring: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  itinerary: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  info: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
}

function ItineraryTimeline({ sections }: { sections: Section[] }) {
  const [expanded, setExpanded] = useState(false)
  const visibleCount = expanded ? sections.length : Math.min(3, sections.length)
  const hasMore = sections.length > 3

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-[#1a1a1a]">Itinerary</h3>
      </div>

      <div className="relative ml-4 border-l-2 border-gray-200 pl-6 space-y-4">
        {sections.slice(0, visibleCount).map((day, i) => {
          // Extract day number from heading
          const dayMatch = day.heading?.match(/day\s+(\d+)/i)
          const dayNum = dayMatch ? dayMatch[1] : String(i + 1)
          // Extract title after the dash/hyphen
          const title = day.heading?.replace(/^day\s+\d+\s*[–\-—:]\s*/i, '') || ''

          return (
            <div key={i} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#c9a227] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a227]" />
              </div>

              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-[#c9a227] uppercase tracking-wider">
                    Day {dayNum}
                  </span>
                  {title && (
                    <span className="text-sm font-semibold text-[#1a1a1a]">{title}</span>
                  )}
                </div>
                {day.content && (
                  <p className="text-sm text-[#6b6b6b] leading-relaxed">{day.content}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 ml-4 flex items-center gap-1.5 text-sm font-medium text-[#c9a227] hover:text-[#b8941f] transition-colors"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show all {sections.length} days <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

function HighlightBox({ section }: { section: Section }) {
  const icon = section.icon || 'info'
  const Icon = ICON_MAP[icon]
  const colors = ICON_COLORS[icon]

  return (
    <div className={`mt-6 rounded-xl p-5 border ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">{section.heading}</h3>
      </div>

      {section.content && (
        <p className="text-sm text-[#6b6b6b] leading-relaxed mb-3">{section.content}</p>
      )}

      {section.items && section.items.length > 0 && (
        <ul className="space-y-2">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#4a4a4a]">
              <CheckCircle2 className={`w-4 h-4 ${colors.text} mt-0.5 flex-shrink-0`} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function RichDescription({ text }: { text: string }) {
  const sections = parseDescription(text)

  // Separate itinerary days from other sections
  const itineraryDays = sections.filter(s => s.type === 'itinerary-day')
  const otherSections = sections.filter(s => s.type !== 'itinerary-day')

  // Find where itinerary days sit in the flow (after an "Itinerary" heading or just in order)
  // We'll render: intro paragraphs, then highlight boxes, then itinerary, then remaining sections
  const introSections: Section[] = []
  const highlightSections: Section[] = []
  const trailingSections: Section[] = []
  let pastItinerary = false

  for (const section of otherSections) {
    if (section.type === 'highlight-box' && section.icon === 'itinerary') {
      pastItinerary = true
      continue // Skip the "Itinerary" heading itself — we render it in the timeline
    }

    if (pastItinerary && itineraryDays.length > 0) {
      trailingSections.push(section)
    } else if (section.type === 'highlight-box' || section.type === 'bullets') {
      highlightSections.push(section)
    } else {
      introSections.push(section)
    }
  }

  // If no itinerary heading was found but we have day entries, split at first day entry
  if (!pastItinerary && itineraryDays.length > 0) {
    // Move any highlight sections after intro to trailing
  }

  return (
    <div className="space-y-0">
      {/* Intro paragraphs */}
      {introSections.map((section, i) => (
        <div key={`intro-${i}`}>
          {section.type === 'paragraph' && (
            <p className="text-[#6b6b6b] leading-relaxed text-[15px] mb-4">{section.content}</p>
          )}
          {section.type === 'highlight-box' && <HighlightBox section={section} />}
        </div>
      ))}

      {/* Highlight boxes (What's Included, etc.) */}
      {highlightSections.map((section, i) => (
        <HighlightBox key={`highlight-${i}`} section={section} />
      ))}

      {/* Itinerary timeline */}
      {itineraryDays.length > 0 && <ItineraryTimeline sections={itineraryDays} />}

      {/* Trailing sections (What to Bring, etc.) */}
      {trailingSections.map((section, i) => (
        <div key={`trail-${i}`}>
          {section.type === 'paragraph' && (
            <p className="text-[#6b6b6b] leading-relaxed text-[15px] mt-4">{section.content}</p>
          )}
          {section.type === 'highlight-box' && <HighlightBox section={section} />}
          {section.type === 'bullets' && <HighlightBox section={section} />}
        </div>
      ))}
    </div>
  )
}
