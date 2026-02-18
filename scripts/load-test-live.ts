/**
 * Live load test with real bidder IDs against production
 */

const PRIZE_ID = 'cml0lq5tq0000i8047pfb19mi'
const BASE_URL = 'https://rgs-auction.vercel.app'
const BIDDER_IDS = [
  'cmkxzoct6000t6w8ehjvnqmo9',
  'cmkxzod4v000u6w8e6p78qk6u',
  'cmkxzodge000v6w8eguykqvss',
  'cmkxzw31h0000lb040d5td8y5',
  'cmkyvub5q0000l4048l58ntv3',
]

interface Result {
  i: number
  status: number
  success: boolean
  error?: string
  ms: number
}

async function placeBid(i: number): Promise<Result> {
  const bidderId = BIDDER_IDS[i % BIDDER_IDS.length]
  const amount = 50000 + i * 500
  const start = Date.now()
  try {
    const res = await fetch(`${BASE_URL}/api/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `rgs_bidder_id=${bidderId}`,
      },
      body: JSON.stringify({ prizeId: PRIZE_ID, amount }),
    })
    const data = await res.json()
    const ms = Date.now() - start
    return { i, status: res.status, success: data.success === true, error: data.error, ms }
  } catch (e) {
    return { i, status: 0, success: false, error: e instanceof Error ? e.message : String(e), ms: Date.now() - start }
  }
}

async function main() {
  console.log(`\n=== Live Load Test ===`)
  console.log(`Target: ${BASE_URL}`)
  console.log(`Prize: ${PRIZE_ID}`)
  console.log(`Bidders: ${BIDDER_IDS.length} (cycling)`)
  console.log(`Concurrent bids: 20\n`)

  const start = Date.now()
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => placeBid(i)))
  console.log(`Completed in ${Date.now() - start}ms\n`)

  const ok = results.filter(r => r.success)
  const fail = results.filter(r => !r.success)
  const limited = results.filter(r => r.status === 429)
  console.log(`Successful: ${ok.length}`)
  console.log(`Failed: ${fail.length}`)
  console.log(`Rate limited: ${limited.length}`)
  console.log(`Avg response: ${Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length)}ms\n`)

  if (fail.length > 0) {
    const reasons = new Map<string, number>()
    fail.forEach(f => {
      const r = f.error || `HTTP ${f.status}`
      reasons.set(r, (reasons.get(r) || 0) + 1)
    })
    console.log('Failure reasons:')
    reasons.forEach((c, r) => console.log(`  "${r}" (x${c})`))
    console.log()
  }

  // Check winning bids
  const bidsRes = await fetch(`${BASE_URL}/api/bids?prizeId=${PRIZE_ID}`)
  const bidsData = await bidsRes.json()
  const bids = bidsData.bids || []
  const winning = bids.filter((b: { status: string }) => b.status === 'WINNING')
  const outbid = bids.filter((b: { status: string }) => b.status === 'OUTBID')

  console.log(`Total bids on prize: ${bids.length}`)
  console.log(`WINNING: ${winning.length}`)
  console.log(`OUTBID: ${outbid.length}`)

  if (winning.length === 1) {
    console.log(`\nPASS: Exactly 1 winning bid (HK$${winning[0].amount.toLocaleString()})`)
  } else if (winning.length === 0) {
    console.log(`\nWARNING: 0 winning bids`)
  } else {
    console.log(`\nFAIL: ${winning.length} winning bids — RACE CONDITION DETECTED!`)
    winning.forEach((b: { id: string; amount: number }) => console.log(`  Bid ${b.id}: HK$${b.amount.toLocaleString()}`))
    process.exit(1)
  }
}

main()
