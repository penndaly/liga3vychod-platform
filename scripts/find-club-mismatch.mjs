/**
 * find-club-mismatch.mjs
 * Queries the fixtures (and results, if it exists) collections, extracts
 * every unique home/away club name, and compares them against the 14 canonical
 * club names from src/config/clubs-config.js.
 *
 * Prints:
 *   - Any names NOT in the canonical list (the typo / mismatch)
 *   - The closest canonical match (fuzzy-matched by character distance)
 *   - Every document ID that carries the bad name
 *   - The exact Firestore update command needed to fix it
 *
 * Usage (no auth required — fixtures are publicly readable):
 *   node scripts/find-club-mismatch.mjs
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Firebase init ──────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const [k, ...v] = l.split('=')
      return [k.trim(), v.join('=').trim()]
    })
)

const app = initializeApp({
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

// ── Canonical club names (mirrors src/config/clubs-config.js) ─────────────
const CLUBS_2025_26 = [
  'FK Humenné',
  'FK Spišská Nová Ves',
  'MŠK Tesla Stropkov',
  'OFK SIM Raslavice',
  'ŠK Odeva Lipany',
  'MFK Spartak Medzev',
  'MFK Snina',
  'FC Košice B',
  '1. MFK Kežmarok',
  'MFK Vranov nad Topľou',
  'FK Poprad',
  'MFK Slovan Sabinov',
  'FC Lokomotíva Košice',
  'MŠK Spišské Podhradie',
]
const CANONICAL = new Set(CLUBS_2025_26)

// ── Levenshtein distance for fuzzy matching ────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function closestCanonical(name) {
  let best = null, bestDist = Infinity
  for (const c of CLUBS_2025_26) {
    const d = levenshtein(name.toLowerCase(), c.toLowerCase())
    if (d < bestDist) { bestDist = d; best = c }
  }
  return { match: best, distance: bestDist }
}

// ── Helpers ────────────────────────────────────────────────────────────────
/** Show invisible / non-ASCII chars as escaped sequences for debugging. */
function showInvisible(str) {
  return [...str].map((ch) => {
    const cp = ch.codePointAt(0)
    if (cp > 126 && cp < 160) return `<U+${cp.toString(16).toUpperCase().padStart(4,'0')}>`
    return ch
  }).join('')
}

/** Collect { name → [docId, …] } from a Firestore snapshot. */
function indexByName(docs, fields) {
  const index = {}   // name → Set of docIds
  for (const d of docs) {
    const data = d.data()
    for (const field of fields) {
      const val = data[field]
      if (typeof val === 'string' && val.trim()) {
        if (!index[val]) index[val] = new Set()
        index[val].add(d.id)
      }
    }
  }
  return index
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  // 1. Query fixtures (public read — no auth needed)
  console.log('📥 Fetching fixtures collection…')
  const fixturesSnap = await getDocs(collection(db, 'fixtures'))
  console.log(`   ${fixturesSnap.size} fixture documents fetched.`)

  // 2. Query results collection if it exists
  let resultsSnap = { size: 0, docs: [] }
  try {
    resultsSnap = await getDocs(collection(db, 'results'))
    console.log(`   ${resultsSnap.size} result documents fetched.`)
  } catch {
    console.log('   results collection not accessible — skipping.')
  }

  // 3. Build name → [docIds] index for both collections
  const fixtureIndex = indexByName(fixturesSnap.docs, ['home', 'away'])
  const resultsIndex = indexByName(resultsSnap.docs, ['home', 'away', 'homeClub', 'awayClub'])

  // 4. Merge and find unique names across both
  const allNames = new Map()   // name → { collections: Set, docIds: Set }
  for (const [name, ids] of Object.entries(fixtureIndex)) {
    if (!allNames.has(name)) allNames.set(name, { collections: new Set(), docIds: new Set() })
    allNames.get(name).collections.add('fixtures')
    for (const id of ids) allNames.get(name).docIds.add(id)
  }
  for (const [name, ids] of Object.entries(resultsIndex)) {
    if (!allNames.has(name)) allNames.set(name, { collections: new Set(), docIds: new Set() })
    allNames.get(name).collections.add('results')
    for (const id of ids) allNames.get(name).docIds.add(id)
  }

  console.log(`\n📋 ${allNames.size} unique club names found across all documents.\n`)

  // 5. Partition into matching vs mismatched
  const matched    = []
  const mismatched = []
  for (const [name, meta] of allNames) {
    if (CANONICAL.has(name)) matched.push(name)
    else mismatched.push({ name, ...meta })
  }

  // ── Report ───────────────────────────────────────────────────────────────
  console.log(`✅ ${matched.length} / 14 canonical names found in Firestore.`)

  if (mismatched.length === 0) {
    console.log('\n🎉 No mismatches — all club names are correct!')
    process.exit(0)
  }

  console.log(`\n❌ ${mismatched.length} unrecognised name(s):\n`)

  for (const { name, collections, docIds } of mismatched) {
    const { match, distance } = closestCanonical(name)
    const colList  = [...collections].join(', ')
    const docList  = [...docIds]

    console.log('─'.repeat(60))
    console.log(`  Mismatched name : "${name}"`)
    console.log(`  Visible chars   : ${showInvisible(name)}`)
    console.log(`  Closest match   : "${match}"  (edit distance: ${distance})`)
    console.log(`  Found in        : ${colList}`)
    console.log(`  Affected docs   : ${docList.length}`)
    docList.forEach((id) => console.log(`    • ${id}`))
    console.log()
    console.log('  Fix — run in Firebase console (JS):')
    for (const col of collections) {
      for (const id of docList) {
        // Determine which fields in this doc carry the bad name
        const snap = col === 'fixtures' ? fixturesSnap : resultsSnap
        const docData = snap.docs.find((d) => d.id === id)?.data() ?? {}
        const badFields = Object.entries(docData)
          .filter(([, v]) => v === name)
          .map(([k]) => k)
        for (const field of badFields) {
          console.log(`    db.collection('${col}').doc('${id}').update({ ${field}: "${match}" })`)
        }
      }
    }
    console.log()
  }

  console.log('─'.repeat(60))
  console.log('\n💡 After fixing, re-run:')
  console.log('   node scripts/trigger-standings.mjs <email> <password>')
  console.log('   to recompute the standings.\n')

  process.exit(mismatched.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err.message ?? err)
  process.exit(1)
})
