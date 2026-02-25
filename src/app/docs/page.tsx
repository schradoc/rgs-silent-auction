'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

const TABS = [
  { id: 'start', label: 'Getting Started' },
  { id: 'prizes', label: 'Managing Prizes' },
  { id: 'event', label: 'Event Night' },
  { id: 'after', label: 'After the Auction' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
] as const

type TabId = typeof TABS[number]['id']

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
      {children}
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
      {children}
    </div>
  )
}

function PageLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline underline-offset-2">
      {children}
      <ExternalLink className="w-3 h-3" />
    </Link>
  )
}

function GettingStartedTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Accessing the Admin Panel</h2>
        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9a227] text-white text-sm font-medium flex items-center justify-center">1</span>
            <span>Go to <PageLink href="/admin/login">rgsauction.com/admin/login</PageLink></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9a227] text-white text-sm font-medium flex items-center justify-center">2</span>
            <span>Enter your admin email and password</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9a227] text-white text-sm font-medium flex items-center justify-center">3</span>
            <span>You&apos;ll land on the <PageLink href="/admin/dashboard">admin dashboard</PageLink></span>
          </li>
        </ol>
      </div>

      <InfoBox>
        <strong>Important:</strong> Always use <strong>rgsauction.com</strong> — not rgs-auction.vercel.app. The Vercel URL is for development only.
      </InfoBox>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Tabs</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-900">Tab</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-900">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">Overview</td><td className="px-4 py-2.5 text-gray-600">Live stats, recent bids, analytics</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">Prizes</td><td className="px-4 py-2.5 text-gray-600">Add, edit, deactivate prizes</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">Bidders</td><td className="px-4 py-2.5 text-gray-600">View all registered bidders and their bids</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">Winners</td><td className="px-4 py-2.5 text-gray-600">Confirm winners after auction closes</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">Helpers</td><td className="px-4 py-2.5 text-gray-600">Manage event helpers (table runners)</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">Settings</td><td className="px-4 py-2.5 text-gray-600">Auction state, display settings, team management</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Setting Up Helpers</h2>
        <p className="text-gray-600 mb-3">Helpers are table runners who assist guests with bidding. Set them up in the <PageLink href="/admin/dashboard">Helpers tab</PageLink>:</p>
        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">1</span>
            <span>Click <strong>Add Helper</strong> and enter a name, 4-digit PIN, and assigned table numbers</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">2</span>
            <span>Share the PIN — helpers log in at <PageLink href="/helper">rgsauction.com/helper</PageLink></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">3</span>
            <span>Helpers can submit bids on behalf of guests</span>
          </li>
        </ol>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Codes</h2>
        <p className="text-gray-600">
          QR codes on tables should point to <strong>rgsauction.com</strong>. No app download needed — everything works in mobile browsers.
        </p>
      </div>
    </div>
  )
}

function ManagingPrizesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviewing Prizes</h2>
        <p className="text-gray-600 mb-3">Go to the <PageLink href="/admin/dashboard">Prizes tab</PageLink> to check all prizes are correct:</p>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span><strong>Title, description, donor name</strong> — verify accuracy</span></li>
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span><strong>Minimum bid</strong> — starting bid in HKD</span></li>
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span><strong>Multi-winner slots</strong> — for prizes with multiple winners</span></li>
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span><strong>Images</strong> — upload clear photos</span></li>
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span><strong>Active status</strong> — only active prizes appear to bidders</span></li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Multi-Winner Prizes</h2>
        <p className="text-gray-600">
          Some prizes allow multiple winners (e.g., a Tuscany villa with 7 rooms). Set <strong>Multi-winner eligible = Yes</strong> and <strong>Slots = number of winners</strong>.
          When all slots are filled, new higher bids outbid the lowest current winner.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pledges</h2>
        <p className="text-gray-600">
          Pledge items (category: PLEDGES) accept every bid — no outbidding. Use for donation tiers.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Clearing Prizes</h2>
        <p className="text-gray-600">
          To start fresh, use the <strong>Clear All</strong> button in the Prizes tab header. This deletes all prizes and their associated bids, images, and favorites.
          Bidders and helpers are kept.
        </p>
        <WarningBox>
          <strong>Warning:</strong> Clearing prizes cannot be undone. Make sure you have exported any data you need first via <strong>Settings &gt; Data &amp; Export</strong>.
        </WarningBox>
      </div>
    </div>
  )
}

function EventNightTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Auction State Flow</h2>
        <div className="bg-gray-50 border rounded-lg p-4 text-center font-mono text-sm text-gray-700">
          PRELAUNCH → LIVE → CLOSED
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-900">State</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-900">What happens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">PRELAUNCH</td><td className="px-4 py-2.5 text-gray-600">Guests can browse prizes but cannot bid</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">LIVE</td><td className="px-4 py-2.5 text-gray-600">Bidding is open on all active prizes</td></tr>
              <tr><td className="px-4 py-2.5 font-medium text-gray-900">CLOSED</td><td className="px-4 py-2.5 text-gray-600">No new bids. Confirm winners.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <InfoBox>
        You can go backwards between states during setup (e.g., LIVE back to PRELAUNCH) if you need to fix something. Change state in <PageLink href="/admin/dashboard">Settings &gt; Auction Management</PageLink>.
      </InfoBox>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Night Steps</h2>
        <ol className="space-y-4 text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c9a227] text-white text-sm font-bold flex items-center justify-center">1</span>
            <div>
              <p className="font-medium">Before guests arrive</p>
              <p className="text-gray-500 text-sm">Set state to <strong>PRELAUNCH</strong>. Guests scan QR codes, browse prizes, and register.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c9a227] text-white text-sm font-bold flex items-center justify-center">2</span>
            <div>
              <p className="font-medium">MC announces bidding open</p>
              <p className="text-gray-500 text-sm">Switch to <strong>LIVE</strong>. All registered bidders can now place bids.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c9a227] text-white text-sm font-bold flex items-center justify-center">3</span>
            <div>
              <p className="font-medium">MC announces bidding closed</p>
              <p className="text-gray-500 text-sm">Switch to <strong>CLOSED</strong>. Optionally auto-confirm winners during this step.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c9a227] text-white text-sm font-bold flex items-center justify-center">4</span>
            <div>
              <p className="font-medium">Confirm winners</p>
              <p className="text-gray-500 text-sm">Go to the <strong>Winners tab</strong> to review and confirm. Winners get notified automatically.</p>
            </div>
          </li>
        </ol>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Helper Tips for Event Night</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span>Helpers log in at <PageLink href="/helper">rgsauction.com/helper</PageLink> with their 4-digit PIN</span></li>
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span>They can submit bids manually on behalf of guests from the helper portal</span></li>
          <li className="flex items-start gap-2"><span className="text-[#c9a227] mt-1">&#9679;</span><span>Their dashboard shows which of their bidders have been outbid — encourage re-bidding!</span></li>
        </ul>
      </div>
    </div>
  )
}

function AfterAuctionTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirming Winners</h2>
        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">1</span>
            <span>Go to the <PageLink href="/admin/dashboard">Winners tab</PageLink></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">2</span>
            <span>Each prize shows the leading bidder(s)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">3</span>
            <span>Click <strong>Confirm &amp; Notify</strong> or <strong>Confirm Only</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">4</span>
            <span>Use <strong>Confirm All</strong> to batch-confirm all winners at once</span>
          </li>
        </ol>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Runner-Ups</h2>
        <p className="text-gray-600">
          Below each winner, you&apos;ll see <strong>&quot;Next in line&quot;</strong> — runner-up bidders with contact details.
          If a winner withdraws, contact the next person.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exporting Data</h2>
        <p className="text-gray-600">
          Go to <PageLink href="/admin/dashboard">Settings &gt; Data &amp; Export</PageLink> to download bids, bidders, and winners as CSV files.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Safety</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2"><span className="text-green-500 mt-1">&#10003;</span><span>Production database is hosted on Supabase with automatic backups</span></li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-1">&#10003;</span><span>Code deployments do NOT affect your data</span></li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-1">&#10003;</span><span>Staging and production databases are completely separate</span></li>
        </ul>
      </div>
    </div>
  )
}

function TroubleshootingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Issues</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-900">Issue</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-900">Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Can&apos;t log in as admin</td>
                <td className="px-4 py-3 text-gray-600">Check spam for magic link. Links expire after 15 minutes. Try <PageLink href="/admin/login">admin login</PageLink>.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Guest can&apos;t bid</td>
                <td className="px-4 py-3 text-gray-600">Verify auction state is <strong>LIVE</strong> in <PageLink href="/admin/dashboard">Settings</PageLink>.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Prize not showing</td>
                <td className="px-4 py-3 text-gray-600">Check prize is <strong>Active</strong> in the Prizes tab.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Helper can&apos;t log in</td>
                <td className="px-4 py-3 text-gray-600">Verify PIN in Helpers tab. Helpers use <PageLink href="/helper">rgsauction.com/helper</PageLink>.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Stuck in wrong state</td>
                <td className="px-4 py-3 text-gray-600">You can go backwards between states now (e.g., LIVE → PRELAUNCH). Use <PageLink href="/admin/dashboard">Settings &gt; Auction Management</PageLink>.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Need to clear all prizes</td>
                <td className="px-4 py-3 text-gray-600">Use the <strong>Clear All</strong> button in the Prizes tab header. Keeps bidders and helpers.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <WarningBox>
        <strong>Event night emergencies:</strong> For technical issues on event night, contact Chris Schrader directly.
      </WarningBox>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/admin/dashboard" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#c9a227] hover:bg-[#c9a227]/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227] text-sm font-bold">A</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Admin Dashboard</p>
              <p className="text-xs text-gray-500">/admin/dashboard</p>
            </div>
          </Link>
          <Link href="/admin/login" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#c9a227] hover:bg-[#c9a227]/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">L</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Admin Login</p>
              <p className="text-xs text-gray-500">/admin/login</p>
            </div>
          </Link>
          <Link href="/helper" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#c9a227] hover:bg-[#c9a227]/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm font-bold">H</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Helper Portal</p>
              <p className="text-xs text-gray-500">/helper</p>
            </div>
          </Link>
          <Link href="/prizes" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#c9a227] hover:bg-[#c9a227]/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold">P</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Prize Listing</p>
              <p className="text-xs text-gray-500">/prizes</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('start')

  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors px-3 py-2 -ml-2 rounded-lg hover:bg-white/10 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Admin Setup Guide</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Subtitle */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            For Rupert and the RGS Committee — Event: 28 February 2026, Hong Kong Club
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#0f1d2d] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          {activeTab === 'start' && <GettingStartedTab />}
          {activeTab === 'prizes' && <ManagingPrizesTab />}
          {activeTab === 'event' && <EventNightTab />}
          {activeTab === 'after' && <AfterAuctionTab />}
          {activeTab === 'troubleshooting' && <TroubleshootingTab />}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8 pb-8">
          For technical issues on event night, contact Chris Schrader directly.
        </p>
      </div>
    </main>
  )
}
