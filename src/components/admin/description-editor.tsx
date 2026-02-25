'use client'

import { useState } from 'react'
import {
  Plus,
  X,
  GripVertical,
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
  content: string // optional paragraph under heading
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
    borderColor: 'border-gray-200',
    bgColor: 'bg-white',
    textColor: 'text-gray-600',
    badgeBg: 'bg-gray-100',
  },
  included: {
    label: 'Included',
    icon: CheckCircle2,
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50/50',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-100',
  },
  bring: {
    label: 'What to Bring',
    icon: Backpack,
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50/50',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
  },
  itinerary: {
    label: 'Itinerary',
    icon: Calendar,
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50/50',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
  },
  info: {
    label: 'Info',
    icon: Info,
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-50/50',
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
        lines.push('') // blank line between days
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
    const line = lines[i]
    const trimmed = line.trim()

    // Check for tagged section
    const tagMatch = trimmed.match(TAG_REGEX)
    if (tagMatch) {
      flushParagraph()
      const tag = tagMatch[1].toLowerCase() as 'included' | 'bring' | 'itinerary' | 'info'
      const heading = tagMatch[2].replace(/:$/, '').trim()

      if (tag === 'itinerary') {
        const days: DayEntry[] = []
        i++
        while (i < lines.length) {
          const dayLine = lines[i]?.trim()
          if (!dayLine) { i++; continue }
          // Stop if we hit another tag
          if (TAG_REGEX.test(dayLine)) break
          // Check for legacy heading that would end the section
          if (dayLine.endsWith(':') && dayLine.length < 80 && !/^day\s+\d+/i.test(dayLine)) break

          const dayMatch = dayLine.match(/^day\s+(\d+)\s*[–\-—:]\s*(.*)/i)
          if (dayMatch) {
            const dayNum = parseInt(dayMatch[1])
            const title = dayMatch[2].replace(/:$/, '').trim()
            // Collect description lines
            const descLines: string[] = []
            i++
            while (i < lines.length) {
              const next = lines[i]?.trim()
              if (!next || /^day\s+\d+/i.test(next) || TAG_REGEX.test(next)) break
              descLines.push(next)
              i++
            }
            days.push({ day: dayNum, title, description: descLines.join(' ') })
          } else {
            i++
          }
        }
        blocks.push({ type: 'itinerary', heading: heading || 'Itinerary', days })
        continue
      }

      // included, bring, info — collect content and bullet items
      const items: string[] = []
      let content = ''
      i++
      while (i < lines.length) {
        const next = lines[i]?.trim()
        if (next === undefined) break
        if (!next) { i++; continue } // skip blanks within section
        if (TAG_REGEX.test(next)) break
        // Stop if we hit a legacy heading (line ending with colon, not a bullet)
        if (next.endsWith(':') && next.length < 80 && !/^[•\-\*]\s/.test(next)) break
        // Stop if we hit a Day entry
        if (/^day\s+\d+/i.test(next)) break

        if (/^[•\-\*]\s/.test(next)) {
          items.push(next.replace(/^[•\-\*]\s*/, '').trim())
        } else {
          // Non-bullet text — treat as content paragraph
          content += (content ? ' ' : '') + next
        }
        i++
      }
      blocks.push({ type: tag, heading: heading || tag, content, items })
      continue
    }

    // Check for legacy heading (no tag) — convert to info block
    if (trimmed.endsWith(':') && trimmed.length < 80 && trimmed.length > 0) {
      flushParagraph()
      const heading = trimmed.replace(/:$/, '').trim()

      // Guess icon type from heading keywords
      const lower = heading.toLowerCase()
      let guessedType: 'included' | 'bring' | 'info' = 'info'
      if (lower.includes('include') || lower.includes('what you get') || lower.includes('package')) guessedType = 'included'
      if (lower.includes('bring') || lower.includes('pack') || lower.includes('prepare') || lower.includes('need')) guessedType = 'bring'

      // Check if next lines are an itinerary
      if (lower.includes('itinerary') || lower.includes('schedule') || lower.includes('program')) {
        const days: DayEntry[] = []
        i++
        while (i < lines.length) {
          const dayLine = lines[i]?.trim()
          if (!dayLine) { i++; continue }
          if (TAG_REGEX.test(dayLine)) break
          if (dayLine.endsWith(':') && dayLine.length < 80 && !/^day\s+\d+/i.test(dayLine)) break

          const dayMatch = dayLine.match(/^day\s+(\d+)\s*[–\-—:]\s*(.*)/i)
          if (dayMatch) {
            const dayNum = parseInt(dayMatch[1])
            const title = dayMatch[2].replace(/:$/, '').trim()
            const descLines: string[] = []
            i++
            while (i < lines.length) {
              const next = lines[i]?.trim()
              if (!next || /^day\s+\d+/i.test(next) || TAG_REGEX.test(next)) break
              descLines.push(next)
              i++
            }
            days.push({ day: dayNum, title, description: descLines.join(' ') })
          } else {
            i++
          }
        }
        if (days.length > 0) {
          blocks.push({ type: 'itinerary', heading, days })
        }
        continue
      }

      // Collect items for bullet-style blocks
      const items: string[] = []
      let content = ''
      i++
      while (i < lines.length) {
        const next = lines[i]?.trim()
        if (next === undefined) break
        if (!next) { i++; break } // blank line ends section
        if (TAG_REGEX.test(next)) break
        if (next.endsWith(':') && next.length < 80 && !/^[•\-\*]\s/.test(next)) break
        if (/^day\s+\d+/i.test(next)) break

        if (/^[•\-\*]\s/.test(next)) {
          items.push(next.replace(/^[•\-\*]\s*/, '').trim())
        } else {
          content += (content ? ' ' : '') + next
        }
        i++
      }
      blocks.push({ type: guessedType, heading, content, items })
      continue
    }

    // Check for orphan day entries (no itinerary heading)
    if (/^day\s+\d+/i.test(trimmed)) {
      flushParagraph()
      const days: DayEntry[] = []
      while (i < lines.length) {
        const dayLine = lines[i]?.trim()
        if (!dayLine) { i++; continue }
        if (TAG_REGEX.test(dayLine)) break
        if (dayLine.endsWith(':') && dayLine.length < 80 && !/^day\s+\d+/i.test(dayLine)) break

        const dayMatch = dayLine.match(/^day\s+(\d+)\s*[–\-—:]\s*(.*)/i)
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1])
          const title = dayMatch[2].replace(/:$/, '').trim()
          const descLines: string[] = []
          i++
          while (i < lines.length) {
            const next = lines[i]?.trim()
            if (!next || /^day\s+\d+/i.test(next) || TAG_REGEX.test(next)) break
            descLines.push(next)
            i++
          }
          days.push({ day: dayNum, title, description: descLines.join(' ') })
        } else {
          break
        }
      }
      if (days.length > 0) {
        blocks.push({ type: 'itinerary', heading: 'Itinerary', days })
      }
      continue
    }

    // Regular text
    if (trimmed) {
      paragraphBuffer.push(trimmed)
    } else if (paragraphBuffer.length > 0) {
      flushParagraph()
    }
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
        <div className="space-y-3">
          {blocks.map((block, blockIndex) => {
            const config = BLOCK_CONFIG[block.type]
            const Icon = config.icon

            return (
              <div
                key={blockIndex}
                className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-lg border border-gray-200 overflow-hidden`}
              >
                {/* Block header */}
                <div className="flex items-center justify-between px-3 py-2 bg-white/60 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.badgeBg} ${config.textColor}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveBlock(blockIndex, -1)}
                      disabled={blockIndex === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(blockIndex, 1)}
                      disabled={blockIndex === blocks.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(blockIndex)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block content */}
                <div className="px-3 py-3">
                  {/* Paragraph block */}
                  {block.type === 'paragraph' && (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(blockIndex, { content: e.target.value })}
                      className="w-full px-2.5 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227] resize-y"
                      rows={3}
                      placeholder="Write a paragraph..."
                    />
                  )}

                  {/* Bullet-based blocks (included, bring, info) */}
                  {(block.type === 'included' || block.type === 'bring' || block.type === 'info') && (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        value={block.heading}
                        onChange={(e) => updateBlock(blockIndex, { heading: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        placeholder="Section heading..."
                      />
                      {block.content !== undefined && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(blockIndex, { content: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227] resize-y"
                          rows={1}
                          placeholder="Optional description text..."
                        />
                      )}
                      <div className="space-y-1.5">
                        {block.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-1.5">
                            <span className={`text-xs ${config.textColor}`}>•</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateItem(blockIndex, itemIndex, e.target.value)}
                              className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                              placeholder="Item..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addItem(blockIndex)
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(blockIndex, itemIndex)}
                              className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addItem(blockIndex)}
                          className={`flex items-center gap-1 text-xs font-medium ${config.textColor} opacity-70 hover:opacity-100 transition-opacity mt-1`}
                        >
                          <Plus className="w-3 h-3" />
                          Add item
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Itinerary block */}
                  {block.type === 'itinerary' && (
                    <div className="space-y-3">
                      {block.days.map((day, dayIndex) => (
                        <div key={dayIndex} className="flex gap-2 items-start">
                          <div className="flex items-center gap-1 pt-1.5 flex-shrink-0">
                            <span className="text-xs font-bold text-[#c9a227] w-10">Day {day.day}</span>
                            <span className="text-gray-300">–</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={day.title}
                              onChange={(e) => updateDay(blockIndex, dayIndex, { title: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                              placeholder="Day title..."
                            />
                            <textarea
                              value={day.description}
                              onChange={(e) => updateDay(blockIndex, dayIndex, { description: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227] resize-y"
                              rows={1}
                              placeholder="Description..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDay(blockIndex, dayIndex)}
                            className="p-1 text-gray-300 hover:text-red-400 transition-colors mt-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addDay(blockIndex)}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-3 h-3" />
                        Add day
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add block toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mr-1">Add section:</span>
            {(Object.keys(BLOCK_CONFIG) as BlockType[]).map((type) => {
              const config = BLOCK_CONFIG[type]
              const Icon = config.icon
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${config.badgeBg} ${config.textColor} border-gray-200 hover:border-gray-300`}
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
