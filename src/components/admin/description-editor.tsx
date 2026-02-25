'use client'

import { useState } from 'react'
import {
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Backpack,
  Calendar,
  Info,
  Type,
  Eye,
  EyeOff,
  Code,
} from 'lucide-react'
import { RichDescription } from '@/components/prizes/rich-description'

// ── Block types ──────────────────────────────────────────────────────

type BlockType = 'paragraph' | 'included' | 'bring' | 'itinerary' | 'info'

interface ParagraphBlock {
  type: 'paragraph'
  content: string
}

interface BulletBlock {
  type: 'included' | 'bring' | 'info'
  heading: string
  content: string
  items: string[]
}

interface DayEntry {
  day: number
  title: string
  description: string
}

interface ItineraryBlock {
  type: 'itinerary'
  heading: string
  days: DayEntry[]
}

type Block = ParagraphBlock | BulletBlock | ItineraryBlock

// ── Config ───────────────────────────────────────────────────────────

const BLOCK_CONFIG: Record<BlockType, {
  label: string
  icon: typeof CheckCircle2
  borderColor: string
  bgColor: string
  textColor: string
  badgeBg: string
}> = {
  paragraph: {
    label: 'Paragraph',
    icon: Type,
    borderColor: 'border-l-gray-200',
    bgColor: 'bg-white',
    textColor: 'text-gray-600',
    badgeBg: 'bg-gray-100',
  },
  included: {
    label: 'Included',
    icon: CheckCircle2,
    borderColor: 'border-l-green-400',
    bgColor: 'bg-green-50/30',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-100',
  },
  bring: {
    label: 'What to Bring',
    icon: Backpack,
    borderColor: 'border-l-amber-400',
    bgColor: 'bg-amber-50/30',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
  },
  itinerary: {
    label: 'Itinerary',
    icon: Calendar,
    borderColor: 'border-l-blue-400',
    bgColor: 'bg-blue-50/30',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
  },
  info: {
    label: 'Info',
    icon: Info,
    borderColor: 'border-l-gray-300',
    bgColor: 'bg-gray-50/30',
    textColor: 'text-gray-600',
    badgeBg: 'bg-gray-100',
  },
}

// ── Serialization: blocks → tagged plain text ────────────────────────

function serializeBlocks(blocks: Block[]): string {
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      return block.content
    }

    if (block.type === 'itinerary') {
      const lines = [`[itinerary] ${block.heading}:`]
      for (const day of block.days) {
        lines.push(`Day ${day.day} – ${day.title}`)
        if (day.description) lines.push(day.description)
        lines.push('')
      }
      return lines.join('\n').trimEnd()
    }

    // included, bring, info
    const tag = block.type
    const lines = [`[${tag}] ${block.heading}:`]
    if (block.content) lines.push(block.content)
    for (const item of block.items) {
      if (item) lines.push(`- ${item}`)
    }
    return lines.join('\n')
  }).join('\n\n')
}

// ── Deserialization: tagged plain text → blocks ──────────────────────

const TAG_REGEX = /^\[(included|bring|itinerary|info)\]\s*(.*)/i
const DAY_REGEX = /^day\s+(\d+)\s*[–\-—:．.]\s*(.*)/i
const HEADING_KEYWORDS = ['itinerary', 'overview', 'highlights', 'details', 'schedule', 'program', 'programme']

function isDayLine(line: string): boolean {
  return /^day\s+\d+/i.test(line.trim())
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (trimmed.endsWith(':') && trimmed.length < 80) return true
  if (HEADING_KEYWORDS.includes(trimmed.toLowerCase())) return true
  return false
}

function guessBlockType(heading: string): 'included' | 'bring' | 'info' {
  const lower = heading.toLowerCase()
  if (lower.includes('include') || lower.includes('what you get') || lower.includes('package')) return 'included'
  if (lower.includes('bring') || lower.includes('pack') || lower.includes('prepare') || lower.includes('need')) return 'bring'
  return 'info'
}

function isItineraryHeading(heading: string): boolean {
  const lower = heading.toLowerCase()
  return lower.includes('itinerary') || lower.includes('schedule') || lower.includes('program')
}

function isBulletLine(line: string): boolean {
  return /^[•\-\*]\s/.test(line.trim())
}

/** Collect consecutive day entries starting at index i. Returns [days, newIndex]. */
function collectDays(lines: string[], startIndex: number): [DayEntry[], number] {
  const days: DayEntry[] = []
  let i = startIndex

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    // Skip blank lines between days
    if (!trimmed) { i++; continue }

    // Stop if we hit a tag, a non-day heading, or a bullet
    if (TAG_REGEX.test(trimmed)) break
    if (isBulletLine(trimmed)) break
    // Stop at headings that aren't day entries
    if (isHeadingLine(trimmed) && !isDayLine(trimmed)) break

    const dayMatch = trimmed.replace(/:$/, '').match(DAY_REGEX)
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1])
      const title = dayMatch[2].replace(/:$/, '').trim()
      const descLines: string[] = []
      i++
      // Collect description lines for this day
      while (i < lines.length) {
        const next = lines[i].trim()
        if (!next) { i++; break } // blank line ends this day's description
        if (isDayLine(next)) break
        if (TAG_REGEX.test(next)) break
        if (isHeadingLine(next) && !isDayLine(next)) break
        if (isBulletLine(next)) break
        descLines.push(next)
        i++
      }
      days.push({ day: dayNum, title, description: descLines.join(' ') })
    } else {
      // Not a day line — stop collecting
      break
    }
  }

  return [days, i]
}

/** Collect bullet items and content text for a heading section. */
function collectSectionContent(lines: string[], startIndex: number): [string, string[], number] {
  let content = ''
  const items: string[] = []
  let i = startIndex
  let consecutiveBlanks = 0

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (!trimmed) {
      consecutiveBlanks++
      // Two consecutive blank lines = end of section
      if (consecutiveBlanks >= 2) { i++; break }
      i++
      continue
    }
    consecutiveBlanks = 0

    // Stop conditions
    if (TAG_REGEX.test(trimmed)) break
    if (isDayLine(trimmed)) break
    if (isHeadingLine(trimmed) && !isBulletLine(trimmed)) break

    if (isBulletLine(trimmed)) {
      items.push(trimmed.replace(/^[•\-\*]\s*/, '').trim())
    } else {
      content += (content ? ' ' : '') + trimmed
    }
    i++
  }

  return [content, items, i]
}

function deserializeText(text: string): Block[] {
  if (!text.trim()) return [{ type: 'paragraph', content: '' }]

  const lines = text.split('\n')
  const blocks: Block[] = []
  let paragraphBuffer: string[] = []

  const flushParagraph = () => {
    const content = paragraphBuffer.join('\n').trim()
    if (content) {
      blocks.push({ type: 'paragraph', content })
    }
    paragraphBuffer = []
  }

  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()

    // Skip blank lines
    if (!trimmed) {
      if (paragraphBuffer.length > 0) {
        flushParagraph()
      }
      i++
      continue
    }

    // 1. Explicit tags: [included], [bring], [itinerary], [info]
    const tagMatch = trimmed.match(TAG_REGEX)
    if (tagMatch) {
      flushParagraph()
      const tag = tagMatch[1].toLowerCase() as 'included' | 'bring' | 'itinerary' | 'info'
      const heading = tagMatch[2].replace(/:$/, '').trim()

      if (tag === 'itinerary') {
        i++
        const [days, newI] = collectDays(lines, i)
        i = newI
        blocks.push({
          type: 'itinerary',
          heading: heading || 'Itinerary',
          days: days.length > 0 ? days : [{ day: 1, title: '', description: '' }],
        })
      } else {
        i++
        const [content, items, newI] = collectSectionContent(lines, i)
        i = newI
        blocks.push({ type: tag, heading: heading || tag, content, items })
      }
      continue
    }

    // 2. Day entries (check BEFORE headings — "Day 1 – Title:" would match both)
    if (isDayLine(trimmed)) {
      flushParagraph()
      const [days, newI] = collectDays(lines, i)
      i = newI
      if (days.length > 0) {
        blocks.push({ type: 'itinerary', heading: 'Itinerary', days })
      }
      continue
    }

    // 3. Headings: lines ending with ":" or standalone keywords like "Itinerary"
    if (isHeadingLine(trimmed)) {
      flushParagraph()
      const heading = trimmed.replace(/:$/, '').trim()

      // Itinerary-type heading → collect days
      if (isItineraryHeading(heading)) {
        i++
        const [days, newI] = collectDays(lines, i)
        i = newI
        if (days.length > 0) {
          blocks.push({ type: 'itinerary', heading, days })
        }
        continue
      }

      // Other heading → collect bullets/content
      const guessed = guessBlockType(heading)
      i++
      const [content, items, newI] = collectSectionContent(lines, i)
      i = newI
      blocks.push({ type: guessed, heading, content, items })
      continue
    }

    // 4. Regular text → paragraph
    paragraphBuffer.push(trimmed)
    i++
  }

  flushParagraph()
  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content: '' }]
}

// ── Block Editor Component ───────────────────────────────────────────

interface DescriptionEditorProps {
  value: string
  onChange: (value: string) => void
}

export function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => deserializeText(value))
  const [showRaw, setShowRaw] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks)
    onChange(serializeBlocks(newBlocks))
  }

  const addBlock = (type: BlockType) => {
    const newBlocks = [...blocks]
    let block: Block

    switch (type) {
      case 'paragraph':
        block = { type: 'paragraph', content: '' }
        break
      case 'itinerary':
        block = { type: 'itinerary', heading: 'Itinerary', days: [{ day: 1, title: '', description: '' }] }
        break
      default:
        block = {
          type,
          heading: type === 'included' ? "What's Included" : type === 'bring' ? 'What to Bring' : 'Details',
          content: '',
          items: [''],
        }
    }

    newBlocks.push(block)
    updateBlocks(newBlocks)
  }

  const removeBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index)
    updateBlocks(newBlocks.length > 0 ? newBlocks : [{ type: 'paragraph', content: '' }])
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= blocks.length) return
    const newBlocks = [...blocks]
    const [moved] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, moved)
    updateBlocks(newBlocks)
  }

  const updateBlock = (index: number, updates: Partial<Block>) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], ...updates } as Block
    updateBlocks(newBlocks)
  }

  // Bullet item helpers
  const addItem = (blockIndex: number) => {
    const block = blocks[blockIndex] as BulletBlock
    const newItems = [...block.items, '']
    updateBlock(blockIndex, { items: newItems })
  }

  const updateItem = (blockIndex: number, itemIndex: number, value: string) => {
    const block = blocks[blockIndex] as BulletBlock
    const newItems = [...block.items]
    newItems[itemIndex] = value
    updateBlock(blockIndex, { items: newItems })
  }

  const removeItem = (blockIndex: number, itemIndex: number) => {
    const block = blocks[blockIndex] as BulletBlock
    const newItems = block.items.filter((_, i) => i !== itemIndex)
    updateBlock(blockIndex, { items: newItems.length > 0 ? newItems : [''] })
  }

  // Day entry helpers
  const addDay = (blockIndex: number) => {
    const block = blocks[blockIndex] as ItineraryBlock
    const nextDay = block.days.length > 0 ? Math.max(...block.days.map(d => d.day)) + 1 : 1
    const newDays = [...block.days, { day: nextDay, title: '', description: '' }]
    updateBlock(blockIndex, { days: newDays })
  }

  const updateDay = (blockIndex: number, dayIndex: number, updates: Partial<DayEntry>) => {
    const block = blocks[blockIndex] as ItineraryBlock
    const newDays = [...block.days]
    newDays[dayIndex] = { ...newDays[dayIndex], ...updates }
    updateBlock(blockIndex, { days: newDays })
  }

  const removeDay = (blockIndex: number, dayIndex: number) => {
    const block = blocks[blockIndex] as ItineraryBlock
    const newDays = block.days.filter((_, i) => i !== dayIndex)
    updateBlock(blockIndex, { days: newDays.length > 0 ? newDays : [{ day: 1, title: '', description: '' }] })
  }

  // Raw text mode
  if (showRaw) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">Raw Text Mode</span>
          <button
            type="button"
            onClick={() => {
              setBlocks(deserializeText(value))
              setShowRaw(false)
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#c9a227] hover:text-[#b8941f] transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            Back to Block Editor
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227] font-mono text-sm leading-relaxed"
          rows={14}
        />
      </div>
    )
  }

  const serialized = serializeBlocks(blocks)

  return (
    <div>
      {/* Header with toggles */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#c9a227] hover:text-[#b8941f] transition-colors"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => setShowRaw(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            Raw Text
          </button>
        </div>
      </div>

      <div className={showPreview ? 'grid grid-cols-2 gap-4' : ''}>
        {/* Block editor */}
        <div className="space-y-2">
          {blocks.map((block, blockIndex) => {
            const config = BLOCK_CONFIG[block.type]
            const Icon = config.icon

            return (
              <div
                key={blockIndex}
                className={`border-l-[3px] ${config.borderColor} ${config.bgColor} rounded-r-lg border border-gray-200 border-l-0`}
              >
                {/* Compact block header */}
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${config.badgeBg} ${config.textColor}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <div className="flex items-center gap-0">
                    <button type="button" onClick={() => moveBlock(blockIndex, -1)} disabled={blockIndex === 0} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveBlock(blockIndex, 1)} disabled={blockIndex === blocks.length - 1} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => removeBlock(blockIndex)} className="p-0.5 text-gray-300 hover:text-red-400 ml-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Block content */}
                <div className="px-2.5 pb-2.5">
                  {/* Paragraph */}
                  {block.type === 'paragraph' && (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(blockIndex, { content: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a227] resize-y bg-white"
                      rows={2}
                      placeholder="Write a paragraph..."
                    />
                  )}

                  {/* Bullet-based blocks (included, bring, info) */}
                  {(block.type === 'included' || block.type === 'bring' || block.type === 'info') && (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={block.heading}
                        onChange={(e) => updateBlock(blockIndex, { heading: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#c9a227] bg-white"
                        placeholder="Section heading..."
                      />
                      {block.content && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(blockIndex, { content: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a227] resize-y bg-white"
                          rows={1}
                          placeholder="Optional description..."
                        />
                      )}
                      <div className="space-y-1">
                        {block.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-1">
                            <span className={`text-xs ${config.textColor} flex-shrink-0`}>•</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateItem(blockIndex, itemIndex, e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a227] bg-white"
                              placeholder="Item..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addItem(blockIndex) }
                                if (e.key === 'Backspace' && !item && block.items.length > 1) {
                                  e.preventDefault(); removeItem(blockIndex, itemIndex)
                                }
                              }}
                            />
                            <button type="button" onClick={() => removeItem(blockIndex, itemIndex)} className="p-0.5 text-gray-300 hover:text-red-400"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addItem(blockIndex)}
                          className={`flex items-center gap-1 text-[11px] font-medium ${config.textColor} opacity-60 hover:opacity-100 transition-opacity`}
                        >
                          <Plus className="w-3 h-3" /> Add item
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Itinerary block */}
                  {block.type === 'itinerary' && (
                    <div className="space-y-2">
                      {block.days.map((day, dayIndex) => (
                        <div key={dayIndex} className="flex gap-1.5 items-start bg-white rounded border border-gray-100 p-2">
                          <span className="text-[11px] font-bold text-[#c9a227] pt-1 flex-shrink-0 w-8">D{day.day}</span>
                          <div className="flex-1 space-y-1 min-w-0">
                            <input
                              type="text"
                              value={day.title}
                              onChange={(e) => updateDay(blockIndex, dayIndex, { title: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#c9a227]"
                              placeholder="Day title..."
                            />
                            <textarea
                              value={day.description}
                              onChange={(e) => updateDay(blockIndex, dayIndex, { description: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a227] resize-y"
                              rows={1}
                              placeholder="Description..."
                            />
                          </div>
                          <button type="button" onClick={() => removeDay(blockIndex, dayIndex)} className="p-0.5 text-gray-300 hover:text-red-400 mt-1"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addDay(blockIndex)}
                        className="flex items-center gap-1 text-[11px] font-medium text-blue-600 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-3 h-3" /> Add day
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add block toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Add:</span>
            {(Object.keys(BLOCK_CONFIG) as BlockType[]).map((type) => {
              const config = BLOCK_CONFIG[type]
              const Icon = config.icon
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${config.badgeBg} ${config.textColor} border-gray-200 hover:border-gray-300`}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-y-auto max-h-[600px]">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Live Preview</p>
            {serialized ? (
              <RichDescription text={serialized} />
            ) : (
              <p className="text-sm text-gray-400">Add sections to see preview...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
