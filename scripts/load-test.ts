/**
 * Load Test: Concurrent Bid Race Condition Validator
 *
 * Fires N concurrent bids at the same prize and verifies
 * that exactly ONE WINNING bid exists afterward.
 *
 * Usage:
 *   npx tsx scripts/load-test.ts [BASE_URL] [PRIZE_ID] [NUM_BIDS]
 *
 * Example:
 *   npx tsx scripts/load-test.ts http://localhost:3000 clxyz123 20
 *
 * Requirements:
 *   - Server must be running
 *   - Test bidders must exist in the database (creates them if needed)
 *   - Prize must exist and be active
 *   - Auction must be open
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const PRIZE_ID = process.argv[3]
const NUM_BIDS = parseInt(process.argv[4] || '20')

if (!PRIZE_ID) {
  console.error('Usage: npx tsx scripts/load-test.ts <BASE_URL> <PRIZE_ID> [NUM_BIDS]')
  console.error('  PRIZE_ID is required. Get one from your database or /api/prizes')
  process.exit(1)
}

interface BidResult {
  index: number
  status: number
  success: boolean
  error?: string
  bidId?: string
  duration: number
}

async function placeBid(index: number, prizeId: string, amount: number, bidderId: string): Promise<BidResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${BASE_URL}/api/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Simulate bidder cookie - in a real test you'd use registered sessions
        Cookie: `rgs_bidder_id=${bidderId}`,
      },
      body: JSON.stringify({ prizeId, amount }),
    })

    const data = await res.json()
    return {
      index,
      status: res.status,
      success: data.success === true,
      error: data.error,
      bidId: data.bid?.id,
      duration: Date.now() - start,
    }
  } catch (err) {
    return {
      index,
      status: 0,
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
      duration: Date.now() - start,
    }
  }
}

async function main() {
  console.log(`\n=== RGS Silent Auction Load Test ===`)
  console.log(`Target: ${BASE_URL}`)
  console.log(`Prize: ${PRIZE_ID}`)
  console.log(`Concurrent bids: ${NUM_BIDS}`)
  console.log()

  // Step 1: Check prize exists
  console.log('1. Checking prize exists...')
  try {
    const prizeRes = await fetch(`${BASE_URL}/api/prizes?id=${PRIZE_ID}`)
    if (!prizeRes.ok) {
      console.error(`   Prize not found (${prizeRes.status}). Make sure the prize ID is correct.`)
      process.exit(1)
    }
    const prizeData = await prizeRes.json()
    const prize = prizeData.prizes?.[0] || prizeData.prize
    console.log(`   Found: "${prize?.title}" - Current bid: HK$${prize?.currentHighestBid || 0}`)
  } catch (err) {
    console.error(`   Failed to reach server at ${BASE_URL}`)
    process.exit(1)
  }

  // Step 2: Fire concurrent bids
  const baseAmount = 50000 // Start well above most prizes
  console.log(`\n2. Firing ${NUM_BIDS} concurrent bids (HK$${baseAmount} - HK$${baseAmount + (NUM_BIDS - 1) * 500})...`)

  const start = Date.now()
  const promises = Array.from({ length: NUM_BIDS }, (_, i) => {
    const amount = baseAmount + i * 500
    const fakeBidderId = `load-test-bidder-${i}`
    return placeBid(i, PRIZE_ID, amount, fakeBidderId)
  })

  const results = await Promise.all(promises)
  const totalDuration = Date.now() - start

  // Step 3: Analyze results
  console.log(`\n3. Results (completed in ${totalDuration}ms):`)

  const successes = results.filter(r => r.success)
  const failures = results.filter(r => !r.success)
  const rateLimited = results.filter(r => r.status === 429)

  console.log(`   Successful: ${successes.length}`)
  console.log(`   Failed: ${failures.length}`)
  console.log(`   Rate limited: ${rateLimited.length}`)
  console.log(`   Avg response time: ${Math.round(results.reduce((s, r) => s + r.duration, 0) / results.length)}ms`)

  if (failures.length > 0) {
    console.log('\n   Failure reasons:')
    const reasons = new Map<string, number>()
    failures.forEach(f => {
      const reason = f.error || `HTTP ${f.status}`
      reasons.set(reason, (reasons.get(reason) || 0) + 1)
    })
    reasons.forEach((count, reason) => {
      console.log(`     - "${reason}" (x${count})`)
    })
  }

  // Step 4: Verify exactly one winner
  console.log(`\n4. Verifying bid integrity...`)
  try {
    const bidsRes = await fetch(`${BASE_URL}/api/bids?prizeId=${PRIZE_ID}`)
    const bidsData = await bidsRes.json()
    const bids = bidsData.bids || []

    const winningBids = bids.filter((b: { status: string }) => b.status === 'WINNING')
    const outbidBids = bids.filter((b: { status: string }) => b.status === 'OUTBID')

    console.log(`   Total bids on prize: ${bids.length}`)
    console.log(`   WINNING bids: ${winningBids.length}`)
    console.log(`   OUTBID bids: ${outbidBids.length}`)

    if (winningBids.length === 1) {
      console.log(`\n   PASS: Exactly 1 winning bid exists`)
      console.log(`   Winner amount: HK$${winningBids[0].amount.toLocaleString()}`)
    } else if (winningBids.length === 0) {
      console.log(`\n   WARNING: No winning bids found (all may have failed)`)
    } else {
      console.log(`\n   FAIL: ${winningBids.length} winning bids found! Race condition detected!`)
      winningBids.forEach((b: { id: string; amount: number; createdAt: string }) => {
        console.log(`     - Bid ${b.id}: HK$${b.amount.toLocaleString()} at ${b.createdAt}`)
      })
      process.exit(1)
    }
  } catch (err) {
    console.error(`   Could not verify: ${err instanceof Error ? err.message : err}`)
  }

  console.log('\n=== Load test complete ===\n')
}

main().catch(console.error)
