/**
 * fix-clubs.mjs
 * Migrates Firestore to the correct 2025/26 Liga 3 Východ club list.
 *
 * Usage:
 *   node scripts/fix-clubs.mjs <email> <password>
 *
 * What it does:
 *   1. Deletes all fixtures, player_stats, deductions, news, and old club docs (+ player subcollections)
 *   2. Writes 14 correct club docs
 *   3. Seeds a full double round-robin schedule (26 rounds, 182 fixtures)
 *   4. Seeds player stats (2 players per club)
 *   5. Seeds 5 news articles
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, getDocs, writeBatch, doc, setDoc,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Read .env ──────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const app = initializeApp({
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
})
const db   = getFirestore(app)
const auth = getAuth(app)

// ── Club definitions ───────────────────────────────────────────────────────
const CLUBS = [
  { id: 1,  name: 'FK Humenné',             short: 'HMN', slug: 'humenne',           strength: 7 },
  { id: 2,  name: 'FK Spišská Nová Ves',    short: 'SNV', slug: 'spisska-nova-ves',  strength: 6 },
  { id: 3,  name: 'MŠK Tesla Stropkov',     short: 'STR', slug: 'stropkov',          strength: 5 },
  { id: 4,  name: 'OFK SIM Raslavice',      short: 'RAS', slug: 'raslavice',         strength: 4 },
  { id: 5,  name: 'ŠK Odeva Lipany',        short: 'LIP', slug: 'lipany',            strength: 6 },
  { id: 6,  name: 'MFK Spartak Medzev',     short: 'MED', slug: 'medzev',            strength: 5 },
  { id: 7,  name: 'MFK Snina',              short: 'SNA', slug: 'snina',             strength: 6 },
  { id: 8,  name: 'FC Košice B',            short: 'KSB', slug: 'kosice-b',          strength: 8 },
  { id: 9,  name: '1. MFK Kežmarok',        short: 'KEŽ', slug: 'kezmarok',          strength: 6 },
  { id: 10, name: 'MFK Vranov nad Topľou',  short: 'VNT', slug: 'vranov',            strength: 7 },
  { id: 11, name: 'FK Poprad',              short: 'POP', slug: 'poprad',            strength: 7 },
  { id: 12, name: 'MFK Slovan Sabinov',     short: 'SAB', slug: 'sabinov',           strength: 5 },
  { id: 13, name: 'FC Lokomotíva Košice',   short: 'LOK', slug: 'lokomotiva-kosice', strength: 5 },
  { id: 14, name: 'MŠK Spišské Podhradie',  short: 'SPP', slug: 'spisske-podhradie', strength: 4 },
]

// ── Helpers ────────────────────────────────────────────────────────────────

/** Delete every doc in a collection ref, in chunks of 499. Returns count deleted. */
async function deleteAll(collRef) {
  const snap = await getDocs(collRef)
  if (snap.empty) return 0
  const refs = snap.docs.map((d) => d.ref)
  for (let i = 0; i < refs.length; i += 499) {
    const batch = writeBatch(db)
    refs.slice(i, i + 499).forEach((r) => batch.delete(r))
    await batch.commit()
  }
  return refs.length
}

/** Commit docs in batches of 499 writes. */
async function batchWrite(items, fn) {
  for (let i = 0; i < items.length; i += 499) {
    const batch = writeBatch(db)
    items.slice(i, i + 499).forEach((item) => fn(batch, item))
    await batch.commit()
  }
}

/** Berger circle algorithm → 13 rounds for 14 teams (single round-robin). */
function bergerRounds(teams) {
  const n = teams.length        // 14
  const fixed = teams[0]
  const rot = [...teams.slice(1)]
  const rounds = []
  for (let r = 0; r < n - 1; r++) {
    const circle = [fixed, ...rot]
    const matches = []
    for (let i = 0; i < n / 2; i++) {
      // Alternate home/away assignments each round to balance home games
      matches.push(r % 2 === 0
        ? [circle[i], circle[n - 1 - i]]
        : [circle[n - 1 - i], circle[i]])
    }
    rounds.push(matches)
    rot.unshift(rot.pop()) // rotate: last → front
  }
  return rounds
}

/** Deterministic score based on team indices, round, and strengths. */
function score(hIdx, aIdx, round, hStr, aStr) {
  const s   = ((hIdx + 1) * 7 + (aIdx + 1) * 13 + round * 3) % 20
  const diff = hStr + 1 - aStr // +1 = home advantage
  const adj  = Math.max(0, Math.min(22, s + diff * 2))
  if (adj < 4)  return [0, 2]
  if (adj < 7)  return [0, 1]
  if (adj < 10) return [1, 1]
  if (adj < 12) return [0, 0]
  if (adj < 15) return [1, 0]
  if (adj < 17) return [2, 1]
  if (adj < 19) return [2, 0]
  if (adj < 21) return [3, 1]
  return [3, 0]
}

/** Format JS Date as DD.MM.YYYY. */
function fmt(d) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

/** Round date: rounds 1-13 Aug–Nov 2025 (7 days apart); 14-26 Mar–May 2026. */
function roundDate(round) {
  const DAY = 864e5
  if (round <= 13) {
    return fmt(new Date(new Date('2025-08-10').getTime() + (round - 1) * 7 * DAY))
  }
  return fmt(new Date(new Date('2026-03-08').getTime() + (round - 14) * 7 * DAY))
}
// Completed: rounds 1-24 (last completed = round 24 → May 17, 2026 < today May 23)
// Scheduled: rounds 25-26 (May 24 and May 31, 2026)
const COMPLETED_THROUGH = 24

// ── Build fixtures ─────────────────────────────────────────────────────────
function buildFixtures() {
  const firstHalf  = bergerRounds(CLUBS)                              // rounds 1-13
  const secondHalf = firstHalf.map((rnd) => rnd.map(([h, a]) => [a, h])) // rounds 14-26

  const fixtures = []
  const allRounds = [...firstHalf, ...secondHalf]

  allRounds.forEach((matches, ri) => {
    const round = ri + 1
    const date  = roundDate(round)
    const isCompleted = round <= COMPLETED_THROUGH

    matches.forEach(([home, away]) => {
      const hIdx = CLUBS.indexOf(home)
      const aIdx = CLUBS.indexOf(away)

      if (isCompleted) {
        const [hg, ag] = score(hIdx, aIdx, round, home.strength, away.strength)
        fixtures.push({ round, home: home.name, away: away.name, date, status: 'completed', homeGoals: hg, awayGoals: ag })
      } else {
        fixtures.push({ round, home: home.name, away: away.name, date, time: '16:30', status: 'scheduled' })
      }
    })
  })
  return fixtures
}

// ── Build player stats ─────────────────────────────────────────────────────
const FIRST = ['Martin','Marek','Ján','Tomáš','Peter','Lukáš','Patrik','Michal','Richard','Filip','Radoslav','Miroslav','Jakub','Vladimír']
const LAST  = ['Kováč','Novák','Horváth','Baláž','Šimko','Mináč','Kováčik','Ferko','Oravec','Mihalík','Hudák','Valko','Gajdoš','Mihoč']

function buildPlayerStats() {
  return CLUBS.flatMap((c, i) => [
    {
      name: `${FIRST[i]} ${LAST[i]}`,
      club: c.name,
      season: '2025/26',
      goals:       Math.max(3, c.strength * 3 - 5 + (i % 4)),
      assists:     2 + (i % 5),
      yellowCards: 1 + (i % 4),
      redCards:    i % 8 === 0 ? 1 : 0,
      appearances: 18 + (i % 7),
    },
    {
      name: `${FIRST[(i + 7) % 14]} ${LAST[(i + 3) % 14]}`,
      club: c.name,
      season: '2025/26',
      goals:       1 + (i % 5),
      assists:     3 + (i % 6),
      yellowCards: 2 + (i % 5),
      redCards:    0,
      appearances: 16 + (i % 8),
    },
  ])
}

// ── Build news ─────────────────────────────────────────────────────────────
function buildNews() {
  return [
    {
      slug: 'kosice-b-lidia-tabulku',
      title: 'Košice B vedú tabuľku po 24. kole',
      excerpt: 'FC Košice B potvrdili vedenie v tabuľke víťazstvom 3:1 nad FK Humenné v 24. kole TIPOS III. Ligy Východ.',
      body: '<p>FC Košice B podali presvedčivý výkon a porazili FK Humenné 3:1. Góly strelili Kováč (2×) a Mihalík.</p>',
      club: 'FC Košice B',
      category: 'Výsledky',
      active: true,
      publishedAt: new Date('2026-05-17'),
    },
    {
      slug: 'vranov-porazil-poprad',
      title: 'Vranov rozdrtil Poprad 2:0',
      excerpt: 'MFK Vranov nad Topľou predviedol presvedčivý výkon a porazil FK Poprad 2:0, čím si upevnil tretie miesto.',
      body: '<p>MFK Vranov nad Topľou zvíťazili 2:0 nad FK Poprad. Góly Nováka a Hudáka rozhodli o troch bodoch.</p>',
      club: 'MFK Vranov nad Topľou',
      category: 'Výsledky',
      active: true,
      publishedAt: new Date('2026-05-17'),
    },
    {
      slug: 'program-25-kola',
      title: 'Program 25. kola: Kľúčové derby víkendu',
      excerpt: 'Najbližšie kolo prinesie zaujímavé stretnutia. Kľúčovým zápasom bude súboj Humenné vs Vranov.',
      body: '<p>V 25. kole čaká divákov viacero zaujímavých záapasov. Najsledovanejším bude stretnutie lídra Košice B s FK Poprad.</p>',
      club: 'Liga',
      category: 'Program',
      active: true,
      publishedAt: new Date('2026-05-20'),
    },
    {
      slug: 'humenne-lieta-v-tabulke',
      title: 'Humenné na druhom mieste pred finišom sezóny',
      excerpt: 'FK Humenné napriek prehre s Košicami udržiava druhé miesto a boják o záchranu kategórie.',
      body: '<p>FK Humenné ostávajú na druhej priečke tabuľky s 49 bodmi, no Košice B vedú o päť bodov.</p>',
      club: 'FK Humenné',
      category: 'Správy',
      active: true,
      publishedAt: new Date('2026-05-18'),
    },
    {
      slug: 'lipany-remizovali-s-medzevom',
      title: 'Lipany remizovali s Medzevom 1:1',
      excerpt: 'ŠK Odeva Lipany si doma podelili body so Spartakom Medzev v dramatickom stretnutí 24. kola.',
      body: '<p>Remíza 1:1 v stretnutí Lipany – Medzev. Ferko vyrovnal v 88. minúte pre domácich.</p>',
      club: 'ŠK Odeva Lipany',
      category: 'Výsledky',
      active: true,
      publishedAt: new Date('2026-05-17'),
    },
  ]
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const [,, email, password] = process.argv
  if (!email || !password) {
    console.error('Usage: node scripts/fix-clubs.mjs <email> <password>')
    process.exit(1)
  }

  console.log('Signing in…')
  await signInWithEmailAndPassword(auth, email, password)
  console.log('Signed in.\n')

  // ── 1. Delete stale data ───────────────────────────────────────────────
  console.log('Deleting old data…')

  // Player subcollections under old club docs
  for (let id = 1; id <= 14; id++) {
    const n = await deleteAll(collection(db, 'clubs', String(id), 'players'))
    if (n > 0) console.log(`  Deleted ${n} players from clubs/${id}`)
  }

  const [fx, ps, dd, nw] = await Promise.all([
    deleteAll(collection(db, 'fixtures')),
    deleteAll(collection(db, 'player_stats')),
    deleteAll(collection(db, 'deductions')),
    deleteAll(collection(db, 'news')),
  ])
  console.log(`  fixtures: ${fx}, player_stats: ${ps}, deductions: ${dd}, news: ${nw}`)

  // Delete old club docs (IDs 1-14)
  {
    const batch = writeBatch(db)
    for (let id = 1; id <= 14; id++) batch.delete(doc(db, 'clubs', String(id)))
    await batch.commit()
    console.log('  Deleted 14 old club docs')
  }

  // ── 2. Write new club docs ─────────────────────────────────────────────
  console.log('\nWriting 14 new club docs…')
  await batchWrite(CLUBS, (batch, c) => {
    batch.set(doc(db, 'clubs', String(c.id)), {
      id: c.id, name: c.name, short: c.short, slug: c.slug,
    })
  })
  console.log('  Done.')

  // ── 3. Seed fixtures ───────────────────────────────────────────────────
  const fixtures = buildFixtures()
  console.log(`\nSeeding ${fixtures.length} fixtures (rounds 1-26)…`)
  let fxIdx = 0
  await batchWrite(fixtures, (batch, f) => {
    batch.set(doc(collection(db, 'fixtures')), { ...f, _idx: fxIdx++ })
  })
  const completed = fixtures.filter((f) => f.status === 'completed').length
  const scheduled = fixtures.filter((f) => f.status === 'scheduled').length
  console.log(`  ${completed} completed, ${scheduled} scheduled.`)

  // ── 4. Seed player stats ───────────────────────────────────────────────
  const stats = buildPlayerStats()
  console.log(`\nSeeding ${stats.length} player stats…`)
  await batchWrite(stats, (batch, s) => {
    batch.set(doc(collection(db, 'player_stats')), s)
  })
  console.log('  Done.')

  // ── 5. Seed news ───────────────────────────────────────────────────────
  const news = buildNews()
  console.log(`\nSeeding ${news.length} news articles…`)
  await batchWrite(news, (batch, n) => {
    batch.set(doc(collection(db, 'news')), n)
  })
  console.log('  Done.')

  console.log('\n✓ Migration complete.')
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
