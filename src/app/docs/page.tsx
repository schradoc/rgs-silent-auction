import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors px-3 py-2 -ml-2 rounded-lg hover:bg-white/10 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Admin Setup Guide</h1>
          <div className="w-16" />
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-8 prose prose-gray">
        <h1>RGS Silent Auction — Admin Setup Guide</h1>
        <p className="text-lg text-gray-500">
          For Rupert and the RGS Committee<br />
          Event: 28 February 2026 — Hong Kong Club<br />
          Production URL: <strong>rgsauction.com</strong>
        </p>

        <hr />

        <h2>Getting Started</h2>
        <h3>Accessing the Admin Panel</h3>
        <ol>
          <li>Go to <strong>rgsauction.com/admin/login</strong></li>
          <li>Enter your admin email and password</li>
          <li>You&apos;ll be taken to the admin dashboard</li>
        </ol>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 not-prose text-sm text-blue-800">
          <strong>Important:</strong> Always use <strong>rgsauction.com</strong> — not rgs-auction.vercel.app. The Vercel URL is for development only.
        </div>

        <hr />

        <h2>Admin Dashboard Overview</h2>
        <table>
          <thead>
            <tr><th>Tab</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Overview</strong></td><td>Live stats, recent bids, analytics</td></tr>
            <tr><td><strong>Prizes</strong></td><td>Add/edit/deactivate prizes</td></tr>
            <tr><td><strong>Bidders</strong></td><td>View all registered bidders and their bids</td></tr>
            <tr><td><strong>Winners</strong></td><td>Confirm winners after auction closes</td></tr>
            <tr><td><strong>Helpers</strong></td><td>Manage event helpers (table runners)</td></tr>
            <tr><td><strong>Settings</strong></td><td>Auction state, display settings, team management</td></tr>
          </tbody>
        </table>

        <hr />

        <h2>Key Setup Tasks</h2>

        <h3>1. Add Helpers</h3>
        <p>Helpers are table runners who assist guests with bidding. Go to the <strong>Helpers</strong> tab:</p>
        <ol>
          <li>Click <strong>Add Helper</strong></li>
          <li>Enter the helper&apos;s name and set a 4-digit PIN</li>
          <li>Share the PIN — helpers log in at <strong>rgsauction.com/helper</strong></li>
        </ol>

        <h3>2. Review Prizes</h3>
        <p>Go to the <strong>Prizes</strong> tab to check all prizes are correct:</p>
        <ul>
          <li><strong>Title, description, donor name</strong> — verify accuracy</li>
          <li><strong>Minimum bid</strong> — starting bid in HKD</li>
          <li><strong>Multi-winner slots</strong> — for prizes with multiple winners</li>
          <li><strong>Images</strong> — upload clear photos</li>
          <li><strong>Active status</strong> — only active prizes appear to bidders</li>
        </ul>

        <h3>3. Multi-Winner Prizes</h3>
        <p>Some prizes allow multiple winners (e.g., Tuscany villa with 7 rooms). Set <strong>Multi-winner eligible = Yes</strong> and <strong>Slots = number of winners</strong>. When all slots are filled, new higher bids outbid the lowest current winner.</p>

        <h3>4. Pledges</h3>
        <p>Pledge items (category: PLEDGES) accept every bid — no outbidding. Use for donation tiers.</p>

        <hr />

        <h2>Auction State Management</h2>
        <p>Go to <strong>Settings &gt; Auction Management</strong>. The auction lifecycle:</p>

        <div className="bg-gray-50 border rounded-lg p-4 not-prose font-mono text-center text-sm">
          PRELAUNCH → LIVE → CLOSED
        </div>

        <table>
          <thead>
            <tr><th>State</th><th>What happens</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>PRELAUNCH</strong></td><td>Guests can browse prizes but cannot bid</td></tr>
            <tr><td><strong>LIVE</strong></td><td>Bidding is open on all active prizes</td></tr>
            <tr><td><strong>CLOSED</strong></td><td>No new bids. Confirm winners.</td></tr>
          </tbody>
        </table>

        <h3>On Event Night</h3>
        <ol>
          <li>Start in <strong>PRELAUNCH</strong> — guests arrive, scan QR, browse</li>
          <li>MC announces bidding open → switch to <strong>LIVE</strong></li>
          <li>MC announces bidding closed → switch to <strong>CLOSED</strong></li>
          <li>Go to <strong>Winners</strong> tab to confirm</li>
        </ol>

        <hr />

        <h2>After the Auction Closes</h2>

        <h3>Confirming Winners</h3>
        <ol>
          <li>Go to the <strong>Winners</strong> tab</li>
          <li>Each prize shows the leading bidder(s)</li>
          <li>Click <strong>Confirm &amp; Notify</strong> or <strong>Confirm Only</strong></li>
          <li>Use <strong>Confirm All</strong> to batch-confirm</li>
        </ol>

        <h3>Runner-Ups</h3>
        <p>Below each winner, you&apos;ll see <strong>&quot;Next in line&quot;</strong> — runner-up bidders with contact details. If a winner withdraws, contact the next person.</p>

        <h3>Exporting Data</h3>
        <p>Go to <strong>Settings &gt; Data &amp; Export</strong> to download bids, bidders, and winners as CSV.</p>

        <hr />

        <h2>Important Notes</h2>

        <h3>Data Safety</h3>
        <ul>
          <li>Production database is hosted on Supabase with automatic backups</li>
          <li>Code deployments do NOT affect your data</li>
          <li>Staging and production databases are completely separate</li>
        </ul>

        <h3>QR Codes</h3>
        <p>QR codes should point to <strong>rgsauction.com</strong>. No app download needed — works in mobile browsers.</p>

        <h3>Troubleshooting</h3>
        <table>
          <thead>
            <tr><th>Issue</th><th>Solution</th></tr>
          </thead>
          <tbody>
            <tr><td>Can&apos;t log in</td><td>Check spam for magic link. Links expire after 15 min.</td></tr>
            <tr><td>Guest can&apos;t bid</td><td>Verify auction state is LIVE in Settings.</td></tr>
            <tr><td>Prize not showing</td><td>Check prize is Active in Prizes tab.</td></tr>
            <tr><td>Helper can&apos;t log in</td><td>Verify PIN in Helpers tab. Use /helper URL.</td></tr>
          </tbody>
        </table>

        <hr />
        <p className="text-gray-400 text-sm">For technical issues on event night, contact Chris Schrader directly.</p>
      </article>
    </main>
  )
}
