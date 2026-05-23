/**
 * Seed script — Liga 3 Východ 2025/26
 * Usage: node scripts/seed.mjs <email> <password>
 *
 * Seeds: settings, clubs, club rosters, fixtures,
 *        player_stats, news, sponsors, referees, awards_potm
 */
import { initializeApp }                           from 'firebase/app'
import { getAuth, signInWithEmailAndPassword }      from 'firebase/auth'
import { getFirestore, doc, setDoc, collection,
         writeBatch, Timestamp }                    from 'firebase/firestore'
import { readFileSync }                             from 'fs'
import { resolve, dirname }                         from 'path'
import { fileURLToPath }                            from 'url'
import { CLUBS_2025_26 }                            from '../src/config/clubs-config.js'

// ── Bootstrap ──────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '..', '.env'), 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const app  = initializeApp({
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db   = getFirestore(app)

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/seed.mjs <email> <password>')
  process.exit(1)
}

async function step(label, fn) {
  process.stdout.write(`  ${label}...`)
  const n = await fn()
  console.log(` ✓${n !== undefined ? ` (${n})` : ''}`)
}

// ── Club data: merge CLUBS_2025_26 with seed-specific metadata ────────────
const CLUB_META = {
  1:  { city: 'Humenné',           founded: 1919, stadium: 'Štadión FK Humenné',               strength: 7 },
  2:  { city: 'Spišská Nová Ves',  founded: 1921, stadium: 'Mestský štadión SNV',               strength: 6 },
  3:  { city: 'Stropkov',          founded: 1921, stadium: 'Štadión MŠK Stropkov',              strength: 5 },
  4:  { city: 'Raslavice',         founded: 1928, stadium: 'Ihrisko OFK Raslavice',             strength: 4 },
  5:  { city: 'Lipany',            founded: 1923, stadium: 'Štadión ŠK Odeva Lipany',           strength: 6 },
  6:  { city: 'Medzev',            founded: 1920, stadium: 'Štadión MFK Medzev',                strength: 5 },
  7:  { city: 'Snina',             founded: 1928, stadium: 'Mestský štadión Snina',             strength: 6 },
  8:  { city: 'Košice',            founded: 1952, stadium: 'Štadión FC Košice',                 strength: 8 },
  9:  { city: 'Kežmarok',          founded: 1921, stadium: 'Mestský štadión Kežmarok',          strength: 6 },
  10: { city: 'Vranov nad Topľou', founded: 1921, stadium: 'Mestský štadión Vranov',            strength: 7 },
  11: { city: 'Poprad',            founded: 1936, stadium: 'Mestský štadión Poprad',            strength: 7 },
  12: { city: 'Sabinov',           founded: 1923, stadium: 'Mestský štadión Sabinov',           strength: 5 },
  13: { city: 'Košice',            founded: 1924, stadium: 'Štadión FC Lokomotíva',             strength: 5 },
  14: { city: 'Spišské Podhradie', founded: 1930, stadium: 'Štadión MŠK Spišské Podhradie',    strength: 4 },
}

const CLUBS = CLUBS_2025_26.map(c => ({ ...c, id: String(c.id), ...CLUB_META[c.id] }))

// ── Score generation ───────────────────────────────────────────────────────
function score(homeIdx, awayIdx, round) {
  const h = CLUBS[homeIdx].strength, a = CLUBS[awayIdx].strength
  const diff = (h - a) + 1
  const seed = (homeIdx * 7 + awayIdx * 13 + round * 3) % 20
  if (diff >= 5)  return seed < 10 ? [3,0] : [2,0]
  if (diff >= 3)  return seed < 8  ? [2,1] : seed < 14 ? [2,0] : seed < 17 ? [1,0] : [3,1]
  if (diff >= 1)  return seed < 6  ? [1,0] : seed < 12 ? [1,1] : seed < 16 ? [2,1] : [0,0]
  if (diff >= -1) return seed < 6  ? [1,1] : seed < 11 ? [0,1] : seed < 16 ? [1,2] : [0,0]
  if (diff >= -3) return seed < 8  ? [0,1] : seed < 14 ? [1,2] : [0,2]
  return seed < 8 ? [0,2] : seed < 14 ? [0,3] : [1,3]
}

// ── Berger round-robin ─────────────────────────────────────────────────────
function buildSchedule() {
  const n = 14, arr = Array.from({length: n-1}, (_,i) => i+1)
  return Array.from({length: n-1}, () => {
    const pairs = [[0, arr[0]]]
    for (let i = 1; i < n/2; i++) pairs.push([arr[i], arr[n-1-i]])
    arr.unshift(arr.pop())
    return pairs
  })
}

const ROUND_DATES = [
  '15.8.2025','22.8.2025','29.8.2025','5.9.2025',
  '12.9.2025','19.9.2025','26.9.2025','3.10.2025',
  '17.10.2025','24.10.2025','31.10.2025',
]

// ── Main ───────────────────────────────────────────────────────────────────
console.log('\n🌱  Liga 3 Východ — seed script\n')

console.log('── Auth')
await step('Signing in', async () => {
  await signInWithEmailAndPassword(auth, email, password)
})

// ── Settings ───────────────────────────────────────────────────────────────
console.log('\n── Settings')
await step('season', async () => {
  await setDoc(doc(db, 'settings', 'season'), {
    currentSeason: '2025/26', currentRound: 2, totalRounds: 26,
    startDate: '15.8.2025', endDate: '31.5.2026',
    updatedAt: Timestamp.now(),
  })
})
await step('league', async () => {
  await setDoc(doc(db, 'settings', 'league'), {
    name: 'TIPOS III. liga Východ', shortName: 'III. Liga Východ',
    season: '2025/26', region: 'Východ', country: 'Slovensko',
    updatedAt: Timestamp.now(),
  })
})
await step('rules', async () => {
  await setDoc(doc(db, 'settings', 'rules'), {
    pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
    teamsCount: 14, promotionSpots: 2, playoffSpots: 1, relegationSpots: 1,
    tiebreakers: ['gd','gf','h2h','abc'],
    updatedAt: Timestamp.now(),
  })
})

// ── Clubs ──────────────────────────────────────────────────────────────────
console.log('\n── Clubs')
await step('profiles', async () => {
  const b = writeBatch(db)
  CLUBS.forEach(c => b.set(doc(db, 'clubs', c.id), {
    name: c.name, short: c.short, slug: c.slug,
    city: c.city, founded: c.founded, stadium: c.stadium,
    updatedAt: Timestamp.now(),
  }))
  await b.commit()
  return CLUBS.length
})

// Rosters for top 3 clubs (by strength: FC Košice B, FK Humenné, MFK Vranov nad Topľou)
const ROSTERS = {
  '1': [ // FK Humenné
    { name: 'Juraj Baláž',      position: 'FWD', jerseyNumber: 9,  dateOfBirth: '1997-03-14', nationality: 'SK' },
    { name: 'Róbert Pál',       position: 'MID', jerseyNumber: 8,  dateOfBirth: '1999-07-22', nationality: 'SK' },
    { name: 'Miroslav Hudák',   position: 'DEF', jerseyNumber: 5,  dateOfBirth: '1996-11-05', nationality: 'SK' },
    { name: 'Peter Rusnák',     position: 'DEF', jerseyNumber: 3,  dateOfBirth: '2000-01-18', nationality: 'SK' },
    { name: 'Lukáš Takáč',     position: 'GK',  jerseyNumber: 1,  dateOfBirth: '1995-08-30', nationality: 'SK' },
    { name: 'Filip Sedlák',     position: 'MID', jerseyNumber: 7,  dateOfBirth: '2001-05-12', nationality: 'SK' },
    { name: 'Dávid Polák',      position: 'FWD', jerseyNumber: 11, dateOfBirth: '1998-09-25', nationality: 'SK' },
  ],
  '8': [ // FC Košice B
    { name: 'Lukáš Horváth',   position: 'FWD', jerseyNumber: 9,  dateOfBirth: '2001-11-14', nationality: 'SK' },
    { name: 'Patrik Kováčik',  position: 'MID', jerseyNumber: 8,  dateOfBirth: '2003-05-07', nationality: 'SK' },
    { name: 'Adam Tóth',       position: 'DEF', jerseyNumber: 5,  dateOfBirth: '2002-09-23', nationality: 'SK' },
    { name: 'Štefan Molnár',   position: 'GK',  jerseyNumber: 1,  dateOfBirth: '2000-07-16', nationality: 'SK' },
    { name: 'Maroš Blaho',     position: 'MID', jerseyNumber: 7,  dateOfBirth: '2002-12-01', nationality: 'SK' },
    { name: 'Marek Kováč',     position: 'FWD', jerseyNumber: 10, dateOfBirth: '1999-04-17', nationality: 'SK' },
  ],
  '10': [ // MFK Vranov nad Topľou
    { name: 'Tomáš Novák',     position: 'FWD', jerseyNumber: 10, dateOfBirth: '1998-04-02', nationality: 'SK' },
    { name: 'Michal Baláž',    position: 'MID', jerseyNumber: 6,  dateOfBirth: '2000-12-17', nationality: 'SK' },
    { name: 'Vladimír Gajdoš', position: 'DEF', jerseyNumber: 4,  dateOfBirth: '1997-06-08', nationality: 'SK' },
    { name: 'Ján Sloboda',     position: 'GK',  jerseyNumber: 1,  dateOfBirth: '1994-02-14', nationality: 'SK' },
    { name: 'Richard Štefan',  position: 'FWD', jerseyNumber: 9,  dateOfBirth: '2002-08-19', nationality: 'SK' },
    { name: 'Martin Horváth',  position: 'DEF', jerseyNumber: 2,  dateOfBirth: '1999-03-31', nationality: 'SK' },
  ],
}

await step('rosters', async () => {
  let count = 0
  for (const [clubId, players] of Object.entries(ROSTERS)) {
    const b = writeBatch(db)
    players.forEach(p => { b.set(doc(collection(db, 'clubs', clubId, 'players')), p); count++ })
    await b.commit()
  }
  return count
})

// ── Fixtures ───────────────────────────────────────────────────────────────
console.log('\n── Fixtures')
await step('generating schedule', async () => {
  const schedule = buildSchedule()    // 13 rounds
  const toSeed   = schedule.slice(0, 11)
  const fixtures = []

  toSeed.forEach((pairs, ri) => {
    const roundNum = ri + 1
    const date     = ROUND_DATES[ri]
    const isComp   = roundNum <= 2

    pairs.forEach(([hi, ai]) => {
      const fx = {
        round: roundNum, date, time: '16:30',
        home: CLUBS[hi].name, away: CLUBS[ai].name,
        status: isComp ? 'completed' : 'scheduled',
      }
      if (isComp) {
        const [hg, ag] = score(hi, ai, roundNum)
        fx.homeGoals = hg
        fx.awayGoals = ag
      }
      fixtures.push(fx)
    })
  })

  for (let i = 0; i < fixtures.length; i += 400) {
    const b = writeBatch(db)
    fixtures.slice(i, i + 400).forEach(fx => b.set(doc(collection(db, 'fixtures')), fx))
    await b.commit()
  }
  return fixtures.length
})

// ── Player stats ───────────────────────────────────────────────────────────
console.log('\n── Player stats')
const PLAYER_STATS = [
  // FC Košice B
  { name: 'Marek Kováč',     club: 'FC Košice B',          season: '2025/26', goals: 3, assists: 1, yellowCards: 0, redCards: 0 },
  { name: 'Lukáš Horváth',   club: 'FC Košice B',          season: '2025/26', goals: 2, assists: 2, yellowCards: 1, redCards: 0 },
  { name: 'Maroš Blaho',     club: 'FC Košice B',          season: '2025/26', goals: 1, assists: 1, yellowCards: 0, redCards: 0 },
  // FK Humenné
  { name: 'Juraj Baláž',     club: 'FK Humenné',           season: '2025/26', goals: 2, assists: 1, yellowCards: 1, redCards: 0 },
  { name: 'Dávid Polák',     club: 'FK Humenné',           season: '2025/26', goals: 1, assists: 2, yellowCards: 0, redCards: 0 },
  // MFK Vranov nad Topľou
  { name: 'Tomáš Novák',     club: 'MFK Vranov nad Topľou', season: '2025/26', goals: 2, assists: 0, yellowCards: 0, redCards: 0 },
  { name: 'Richard Štefan',  club: 'MFK Vranov nad Topľou', season: '2025/26', goals: 1, assists: 1, yellowCards: 1, redCards: 0 },
  // FK Poprad
  { name: 'Peter Šimko',     club: 'FK Poprad',            season: '2025/26', goals: 2, assists: 1, yellowCards: 1, redCards: 0 },
  { name: 'Ondrej Fecko',    club: 'FK Poprad',            season: '2025/26', goals: 1, assists: 0, yellowCards: 2, redCards: 0 },
  // ŠK Odeva Lipany
  { name: 'Marcel Olejník',  club: 'ŠK Odeva Lipany',     season: '2025/26', goals: 1, assists: 2, yellowCards: 0, redCards: 0 },
  // FK Spišská Nová Ves
  { name: 'Igor Ragan',      club: 'FK Spišská Nová Ves',  season: '2025/26', goals: 1, assists: 1, yellowCards: 1, redCards: 0 },
  // MFK Snina
  { name: 'Norbert Takács',  club: 'MFK Snina',            season: '2025/26', goals: 1, assists: 0, yellowCards: 1, redCards: 0 },
  // 1. MFK Kežmarok
  { name: 'Stanislav Bača',  club: '1. MFK Kežmarok',      season: '2025/26', goals: 1, assists: 0, yellowCards: 2, redCards: 0 },
  // MFK Spartak Medzev
  { name: 'Ján Hudák',       club: 'MFK Spartak Medzev',   season: '2025/26', goals: 0, assists: 1, yellowCards: 1, redCards: 0 },
  // MŠK Tesla Stropkov
  { name: 'Anton Demčák',    club: 'MŠK Tesla Stropkov',   season: '2025/26', goals: 0, assists: 1, yellowCards: 1, redCards: 0 },
  // MFK Slovan Sabinov
  { name: 'Tibor Kočiš',     club: 'MFK Slovan Sabinov',   season: '2025/26', goals: 0, assists: 0, yellowCards: 2, redCards: 0 },
  // FC Lokomotíva Košice
  { name: 'Miroslav Kňaze',  club: 'FC Lokomotíva Košice', season: '2025/26', goals: 0, assists: 1, yellowCards: 0, redCards: 0 },
  // OFK SIM Raslavice
  { name: 'Ľuboš Šofranko',  club: 'OFK SIM Raslavice',    season: '2025/26', goals: 0, assists: 0, yellowCards: 1, redCards: 0 },
  // MŠK Spišské Podhradie
  { name: 'Vladimír Valko',  club: 'MŠK Spišské Podhradie', season: '2025/26', goals: 0, assists: 0, yellowCards: 1, redCards: 0 },
]

await step('player_stats', async () => {
  const b = writeBatch(db)
  PLAYER_STATS.forEach(p => b.set(doc(collection(db, 'player_stats')), p))
  await b.commit()
  return PLAYER_STATS.length
})

// ── News ───────────────────────────────────────────────────────────────────
console.log('\n── News')
const NEWS = [
  {
    title: 'Košice B ovládli úvod sezóny',
    slug: 'kosice-b-ovladli-uvod-sezony',
    excerpt: 'FC Košice B suverénne zvládli prvé dve kolá TIPOS III. ligy Východ a vedú tabuľku s plným počtom bodov.',
    content: '<p>FC Košice B predviedli v prvých dvoch kolách presvedčivý futbal a suverénne vedú tabuľku TIPOS III. ligy Východ. Ich kanonír Marek Kováč je s troma gólmi na čele tabuľky strelcov.</p>',
    category: 'výsledky', club: 'FC Košice B',
    publishedAt: Timestamp.fromDate(new Date('2025-08-23')),
    active: true,
  },
  {
    title: 'Vranov vyhral debut na vlastnom štadióne',
    slug: 'vranov-vyhral-debut-na-vlastnom-stadione',
    excerpt: 'MFK Vranov nad Topľou odštartoval sezónu víťazstvom pred vlastnými fanúšikmi. Tomáš Novák strelil oba góly tímu.',
    content: '<p>MFK Vranov nad Topľou vyhral v 1. kole a Tomáš Novák sa postaral o oba góly tímu. Vranov patrí k favoritom sezóny.</p>',
    category: 'výsledky', club: 'MFK Vranov nad Topľou',
    publishedAt: Timestamp.fromDate(new Date('2025-08-16')),
    active: true,
  },
  {
    title: 'Program 3. kola: Prvé dôležité duely',
    slug: 'program-3-kola-prve-dolezite-duely',
    excerpt: 'Tretie kolo TIPOS III. ligy Východ prinesie prvé súboje medzi priamymi konkurentmi. Na programe sú zaujímavé stretnutia.',
    content: '<p>Tretie kolo sezóny 2025/26 sa odohrá 29. augusta 2025. Fanúšikovia sa môžu tešiť na niekoľko zaujímavých súbojov.</p>',
    category: 'program', club: 'Liga',
    publishedAt: Timestamp.fromDate(new Date('2025-08-26')),
    active: true,
  },
  {
    title: 'Humenné prekvapením 2. kola',
    slug: 'humenne-prekvapenim-2-kola',
    excerpt: 'FK Humenné zvíťazili v 2. kole a zaradili sa medzi prekvapenia úvodu sezóny. Juraj Baláž strelil víťazný gól.',
    content: '<p>FK Humenné predviedli výborný výkon v 2. kole a triumfovali zásluhou gólu Juraja Baláža. Tím prekvapuje v úvode sezóny.</p>',
    category: 'výsledky', club: 'FK Humenné',
    publishedAt: Timestamp.fromDate(new Date('2025-08-23')),
    active: true,
  },
  {
    title: 'Disciplinárna komisia po 2. kole',
    slug: 'disciplinarna-komisia-po-2-kole',
    excerpt: 'Disciplinárna komisia TIPOS III. ligy Východ prejednala prvé priestupky sezóny z 2. kola súťaže.',
    content: '<p>Disciplinárna komisia zasadala po 2. kole a prejednala niekoľko priestupkov. Udelila prvé žlté karty a upozornenia pre sezónu 2025/26.</p>',
    category: 'disciplinárne', club: 'Liga',
    publishedAt: Timestamp.fromDate(new Date('2025-08-25')),
    active: true,
  },
]

await step('articles', async () => {
  const b = writeBatch(db)
  NEWS.forEach(n => b.set(doc(collection(db, 'news')), n))
  await b.commit()
  return NEWS.length
})

// ── Sponsors ───────────────────────────────────────────────────────────────
console.log('\n── Sponsors')
const SPONSORS = [
  { name: 'TIPOS',             tier: 'title',  order: 1, active: true, website: 'https://tipos.sk',    sections: ['homepage','fixtures','standings'], logoUrl: null },
  { name: 'Kaufland Slovensko',tier: 'gold',   order: 1, active: true, website: 'https://kaufland.sk', sections: ['homepage'],                       logoUrl: null },
  { name: 'RegioJet',          tier: 'silver', order: 1, active: true, website: 'https://regiojet.sk', sections: ['homepage'],                       logoUrl: null },
]

await step('sponsors', async () => {
  const b = writeBatch(db)
  SPONSORS.forEach(s => b.set(doc(collection(db, 'sponsors')), s))
  await b.commit()
  return SPONSORS.length
})

// ── Referees ───────────────────────────────────────────────────────────────
console.log('\n── Referees')
const REFEREES = [
  { name: 'Vladimír Krajči',  grade: 'Regionálna', region: 'Prešov',   phone: '+421 910 111 222', email: 'krajci@sfz.sk',  active: true },
  { name: 'Ján Beňo',         grade: 'Regionálna', region: 'Košice',   phone: '+421 911 222 333', email: 'beno@sfz.sk',    active: true },
  { name: 'Miroslav Havrila', grade: 'Oblastná',   region: 'Prešov',   phone: '+421 915 333 444', email: 'havrila@sfz.sk', active: true },
  { name: 'Tomáš Džunda',     grade: 'Oblastná',   region: 'Košice',   phone: '+421 948 444 555', email: 'dzunda@sfz.sk',  active: true },
  { name: 'Peter Maník',      grade: 'Regionálna', region: 'Bardejov', phone: '+421 902 555 666', email: 'manik@sfz.sk',   active: true },
]

await step('referees', async () => {
  const b = writeBatch(db)
  REFEREES.forEach(r => b.set(doc(collection(db, 'referees')), r))
  await b.commit()
  return REFEREES.length
})

// ── Awards ─────────────────────────────────────────────────────────────────
console.log('\n── Awards')
const POTM = [
  {
    season: '2025/26', monthKey: 'aug-2025', monthLabel: 'August 2025',
    playerName: 'Marek Kováč', club: 'FC Košice B', goals: 3, assists: 1, votes: 312,
  },
]

await step('awards_potm', async () => {
  for (const p of POTM) await setDoc(doc(db, 'awards_potm', `2025-26_${p.monthKey}`), p)
  return POTM.length
})

console.log('\n✅  Seed complete!\n')
process.exit(0)
