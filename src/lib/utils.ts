import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-HK', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-HK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function getMinimumBidIncrement(currentBid: number): number {
  if (currentBid < 10000) return 500
  if (currentBid < 30000) return 1000
  if (currentBid < 50000) return 2000
  return 5000
}

export function getMinimumNextBid(currentHighestBid: number, minimumBid: number): number {
  if (currentHighestBid === 0) return minimumBid
  return currentHighestBid + getMinimumBidIncrement(currentHighestBid)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
