/**
 * Seed script — Liga 3 Východ 2025/26
 * Usage: node scripts/seed.mjs <email> <password>
 *
 * Seeds: settings, clubs, club rosters, fixtures (8 completed + 3 upcoming),
 *        player_stats, news, sponsors, referees, awards_potm
 */
import { initializeApp }                           from 'firebase/app'
import { getAuth, signInWithEmailAndPassword }      from 'firebase/auth'
import { getFirestore, doc, setDoc, collection,
         writeBatch, Timestamp }                    from 'firebase/firestore'
import { readFileSync }                             from 'fs'
import { resolve, dirname }                         from 'path'
import { fileURLToPath }                            from 'url'

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

// ── Reference data ─────────────────────────────────────────────────────────
const CLUBS = [
  { id: '1',  name: 'FK Humenné',             short: 'HMN', city: 'Humenné',              founded: 1919, stadium: 'Štadión FK Humenné',            strength: 7 },
  { id: '2',  name: 'FK Spišská Nová Ves',    short: 'SNV', city: 'Spišská Nová Ves',     founded: 1921, stadium: 'Štadión FK Spišská Nová Ves',   strength: 6 },
  { id: '3',  name: 'MŠK Tesla Stropkov',     short: 'STR', city: 'Stropkov',             founded: 1921, stadium: 'Štadión MŠK Stropkov',          strength: 5 },
  { id: '4',  name: 'OFK SIM Raslavice',      short: 'RAS', city: 'Raslavice',            founded: 1928, stadium: 'Ihrisko OFK Raslavice',         strength: 4 },
  { id: '5',  name: 'ŠK Odeva Lipany',        short: 'LIP', city: 'Lipany',               founded: 1923, stadium: 'Štadión ŠK Odeva Lipany',       strength: 6 },
  { id: '6',  name: 'MFK Spartak Medzev',     short: 'MED', city: 'Medzev',               founded: 1920, stadium: 'Štadión MFK Medzev',            strength: 5 },
  { id: '7',  name: 'MFK Snina',              short: 'SNA', city: 'Snina',                founded: 1928, stadium: 'Štadión MFK Snina',             strength: 6 },
  { id: '8',  name: 'FC Košice B',            short: 'KSB', city: 'Košice',               founded: 1952, stadium: 'Štadión FC Košice',             strength: 8 },
  { id: '9',  name: '1. MFK Kežmarok',        short: 'KEŽ', city: 'Kežmarok',             founded: 1921, stadium: 'Štadión 1. MFK Kežmarok',       strength: 6 },
  { id: '10', name: 'MFK Vranov nad Topľou',  short: 'VNT', city: 'Vranov nad Topľou',    founded: 1921, stadium: 'Štadión MFK Vranov',            strength: 7 },
  { id: '11', name: 'FK Poprad',              short: 'POP', city: 'Poprad',               founded: 1936, stadium: 'Štadión FK Poprad',             strength: 7 },
  { id: '12', name: 'MFK Slovan Sabinov',     short: 'SAB', city: 'Sabinov',              founded: 1923, stadium: 'Štadión MFK Sabinov',           strength: 5 },
  { id: '13', name: 'FC Lokomotíva Košice',   short: 'LOK', city: 'Košice',               founded: 1924, stadium: 'Štadión FC Lokomotíva',         strength: 5 },
  { id: '14', name: 'MŠK Spišské Podhradie',  short: 'SPP', city: 'Spišské Podhradie',    founded: 1930, stadium: 'Štadión MŠK Spišské Podhradie', strength: 4 },
]

// Deterministic score from team strengths + home advantage
function score(homeIdx, awayIdx, round) {
  const h = CLUBS[homeIdx].strength, a = CLUBS[awayIdx].strength
  const diff = (h - a) + 1          // +1 home advantage
  const seed = (homeIdx * 7 + awayIdx * 13 + round * 3) % 20
  if (diff >= 5)  return seed < 10 ? [3,0] : [2,0]
  if (diff >= 3)  return seed < 8  ? [2,1] : seed < 14 ? [2,0] : seed < 17 ? [1,0] : [3,1]
  if (diff >= 1)  return seed < 6  ? [1,0] : seed < 12 ? [1,1] : seed < 16 ? [2,1] : [0,0]
  if (diff >= -1) return seed < 6  ? [1,1] : seed < 11 ? [0,1] : seed < 16 ? [1,2] : [0,0]
  if (diff >= -3) return seed < 8  ? [0,1] : seed < 14 ? [1,2] : [0,2]
  return seed < 8 ? [0,2] : seed < 14 ? [0,3] : [1,3]
}

// Berger round-robin schedule for 14 teams (first half of season)
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
  '10.8.2025','17.8.2025','24.8.2025','31.8.2025',
  '7.9.2025', '14.9.2025','21.9.2025','28.9.2025',
  '5.10.2025','19.10.2025','26.10.2025',
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
    currentSeason: '2025/26', currentRound: 8, totalRounds: 26,
    startDate: '10.8.2025', endDate: '1.6.2026',
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
    name: c.name, city: c.city, founded: c.founded,
    stadium: c.stadium, updatedAt: Timestamp.now(),
  }))
  await b.commit()
  return CLUBS.length
})

// Rosters for the top 3 clubs
const ROSTERS = {
  '1': [ // FK Bardejov
    { name: 'Marek Kováč',    position: 'FWD', jerseyNumber: 9,  dateOfBirth: '1997-03-14', nationality: 'SK' },
    { name: 'Rastislav Mináč',position: 'MID', jerseyNumber: 8,  dateOfBirth: '1999-07-22', nationality: 'SK' },
    { name: 'Jozef Varga',    position: 'DEF', jerseyNumber: 5,  dateOfBirth: '1996-11-05', nationality: 'SK' },
    { name: 'Peter Rusnák',   position: 'DEF', jerseyNumber: 3,  dateOfBirth: '2000-01-18', nationality: 'SK' },
    { name: 'Lukáš Takáč',   position: 'GK',  jerseyNumber: 1,  dateOfBirth: '1995-08-30', nationality: 'SK' },
    { name: 'Filip Sedlák',   position: 'MID', jerseyNumber: 7,  dateOfBirth: '2001-05-12', nationality: 'SK' },
    { name: 'Dávid Polák',    position: 'FWD', jerseyNumber: 11, dateOfBirth: '1998-09-25', nationality: 'SK' },
  ],
  '2': [ // MFK Vranov nad Topľou
    { name: 'Tomáš Novák',    position: 'FWD', jerseyNumber: 10, dateOfBirth: '1998-04-02', nationality: 'SK' },
    { name: 'Michal Baláž',   position: 'MID', jerseyNumber: 6,  dateOfBirth: '2000-12-17', nationality: 'SK' },
    { name: 'Vladimír Gajdoš',position: 'DEF', jerseyNumber: 4,  dateOfBirth: '1997-06-08', nationality: 'SK' },
    { name: 'Ján Sloboda',    position: 'GK',  jerseyNumber: 1,  dateOfBirth: '1994-02-14', nationality: 'SK' },
    { name: 'Richard Štefan', position: 'FWD', jerseyNumber: 9,  dateOfBirth: '2002-08-19', nationality: 'SK' },
    { name: 'Martin Horváth', position: 'DEF', jerseyNumber: 2,  dateOfBirth: '1999-03-31', nationality: 'SK' },
  ],
  '7': [ // FC Košice B
    { name: 'Lukáš Horváth',  position: 'FWD', jerseyNumber: 9,  dateOfBirth: '2001-11-14', nationality: 'SK' },
    { name: 'Patrik Kováčik', position: 'MID', jerseyNumber: 8,  dateOfBirth: '2003-05-07', nationality: 'SK' },
    { name: 'Adam Tóth',      position: 'DEF', jerseyNumber: 5,  dateOfBirth: '2002-09-23', nationality: 'SK' },
    { name: 'Štefan Molnár',  position: 'GK',  jerseyNumber: 1,  dateOfBirth: '2000-07-16', nationality: 'SK' },
    { name: 'Maroš Blaho',    position: 'MID', jerseyNumber: 7,  dateOfBirth: '2002-12-01', nationality: 'SK' },
  ],
}

await step('rosters', async () => {
  let count = 0
  for (const [clubId, players] of Object.entries(ROSTERS)) {
    const b = writeBatch(db)
    players.forEach(p => {
      b.set(doc(collection(db, 'clubs', clubId, 'players')), p)
      count++
    })
    await b.commit()
  }
  return count
})

// ── Fixtures ───────────────────────────────────────────────────────────────
console.log('\n── Fixtures')
await step('generating schedule', async () => {
  const schedule = buildSchedule()    // 13 rounds
  const toSeed   = schedule.slice(0, 11) // rounds 1-11
  const fixtures = []

  toSeed.forEach((pairs, ri) => {
    const roundNum = ri + 1
    const date     = ROUND_DATES[ri]
    const isComp   = roundNum <= 8

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

  // Write in batches of 400
  for (let i = 0; i < fixtures.length; i += 400) {
    const b = writeBatch(db)
    fixtures.slice(i, i + 400).forEach(fx =>
      b.set(doc(collection(db, 'fixtures')), fx)
    )
    await b.commit()
  }
  return fixtures.length
})

// ── Player stats ───────────────────────────────────────────────────────────
console.log('\n── Player stats')
const PLAYER_STATS = [
  // FK Bardejov
  { name: 'Marek Kováč',     club: 'FK Bardejov',               season: '2025/26', goals: 10, assists: 3, yellowCards: 1, redCards: 0 },
  { name: 'Dávid Polák',     club: 'FK Bardejov',               season: '2025/26', goals: 5,  assists: 4, yellowCards: 2, redCards: 0 },
  { name: 'Filip Sedlák',    club: 'FK Bardejov',               season: '2025/26', goals: 3,  assists: 6, yellowCards: 1, redCards: 0 },
  { name: 'Rastislav Mináč', club: 'FK Bardejov',               season: '2025/26', goals: 2,  assists: 5, yellowCards: 3, redCards: 0 },
  { name: 'Jozef Varga',     club: 'FK Bardejov',               season: '2025/26', goals: 1,  assists: 1, yellowCards: 4, redCards: 0 },
  // MFK Vranov
  { name: 'Tomáš Novák',     club: 'MFK Vranov nad Topľou',     season: '2025/26', goals: 8,  assists: 2, yellowCards: 2, redCards: 0 },
  { name: 'Richard Štefan',  club: 'MFK Vranov nad Topľou',     season: '2025/26', goals: 4,  assists: 3, yellowCards: 1, redCards: 1 },
  { name: 'Michal Baláž',    club: 'MFK Vranov nad Topľou',     season: '2025/26', goals: 2,  assists: 5, yellowCards: 3, redCards: 0 },
  // FC Košice B
  { name: 'Lukáš Horváth',   club: 'FC Košice B',               season: '2025/26', goals: 7,  assists: 1, yellowCards: 1, redCards: 0 },
  { name: 'Maroš Blaho',     club: 'FC Košice B',               season: '2025/26', goals: 3,  assists: 4, yellowCards: 2, redCards: 0 },
  { name: 'Patrik Kováčik',  club: 'FC Košice B',               season: '2025/26', goals: 2,  assists: 3, yellowCards: 4, redCards: 0 },
  // FK Humenné
  { name: 'Juraj Baláž',     club: 'FK Humenné',                season: '2025/26', goals: 6,  assists: 2, yellowCards: 2, redCards: 0 },
  { name: 'Róbert Pál',      club: 'FK Humenné',                season: '2025/26', goals: 2,  assists: 1, yellowCards: 5, redCards: 0 },
  // TJ Slavoj Trebišov
  { name: 'Peter Šimko',     club: 'TJ Slavoj Trebišov',        season: '2025/26', goals: 5,  assists: 2, yellowCards: 3, redCards: 0 },
  { name: 'Miroslav Kňaze',  club: 'TJ Slavoj Trebišov',        season: '2025/26', goals: 2,  assists: 3, yellowCards: 1, redCards: 0 },
  // FK Gelnica
  { name: 'Ondrej Fecko',    club: 'FK Gelnica',                season: '2025/26', goals: 4,  assists: 1, yellowCards: 2, redCards: 0 },
  // FK Sabinov
  { name: 'Tibor Kočiš',     club: 'FK Sabinov',                season: '2025/26', goals: 3,  assists: 2, yellowCards: 2, redCards: 0 },
  // TJ Spišská Nová Ves
  { name: 'Marcel Olejník',  club: 'TJ Spišská Nová Ves',       season: '2025/26', goals: 3,  assists: 1, yellowCards: 4, redCards: 1 },
  // TJ Sokol Stará Ľubovňa
  { name: 'Anton Demčák',    club: 'TJ Sokol Stará Ľubovňa',   season: '2025/26', goals: 2,  assists: 2, yellowCards: 3, redCards: 0 },
  // FK Rešov
  { name: 'Igor Ragan',      club: 'FK Rešov',                  season: '2025/26', goals: 2,  assists: 0, yellowCards: 5, redCards: 1 },
  // MFK Michalovce B
  { name: 'Norbert Takács',  club: 'MFK Michalovce B',          season: '2025/26', goals: 2,  assists: 1, yellowCards: 2, redCards: 0 },
  // TJ Dynamo Prešov
  { name: 'Ľuboš Šofranko',  club: 'TJ Dynamo Prešov',          season: '2025/26', goals: 1,  assists: 1, yellowCards: 3, redCards: 0 },
  // TJ Čeľovce
  { name: 'Stanislav Bača',  club: 'TJ Čeľovce',               season: '2025/26', goals: 1,  assists: 0, yellowCards: 4, redCards: 1 },
  // TJ Partizán BNV
  { name: 'Ján Hudák',       club: 'TJ Partizán Bardejovská Nová Ves', season: '2025/26', goals: 1, assists: 2, yellowCards: 2, redCards: 0 },
]

await step('player_stats', async () => {
  const b = writeBatch(db)
  PLAYER_STATS.forEach(p =>
    b.set(doc(collection(db, 'player_stats')), p)
  )
  await b.commit()
  return PLAYER_STATS.length
})

// ── News ───────────────────────────────────────────────────────────────────
console.log('\n── News')
const NEWS = [
  {
    title: 'Bardejov potvrdil pozíciu lídra tabuľky',
    slug: 'bardejov-potrdil-poziciu-lidera-tabulky',
    excerpt: 'FK Bardejov zvíťazil v 8. kole nad FK Humenné 2:1 a s 22 bodmi vedie tabuľku TIPOS III. ligy Východ. Autor oboch gólov Marek Kováč s 10 gólmi ovláda tabuľku strelcov.',
    content: '<p>FK Bardejov zvíťazil v nedeľňajšom dueli 8. kola nad FK Humenné 2:1 a upevnil svoje vedúce postavenie v tabuľke TIPOS III. ligy Východ.</p><p>Oba góly domácich strelil kanonír Marek Kováč, ktorý sa tak dostal na desať presných zásahov v sezóne a výrazne vedie tabuľku strelcov ligy.</p><p>Bardejov má po ôsmich odohraných kolách 22 bodov a na druhý Vranov stráca sedem bodov.</p>',
    category: 'výsledky', club: 'FK Bardejov',
    publishedAt: Timestamp.fromDate(new Date('2025-09-28')),
    active: true,
  },
  {
    title: 'Vranov rozdrtil Sabinov 3:0',
    slug: 'vranov-rozdrtil-sabinov-3-0',
    excerpt: 'MFK Vranov nad Topľou predviedol dominantný výkon a porazil FK Sabinov 3:0. Tomáš Novák pridal dva góly a je druhý v tabuľke strelcov so 8 presným zásahmi.',
    content: '<p>MFK Vranov nad Topľou sa v 8. kole výrazne postaral o body. Favorit pred vlastnými fanúšikmi porazil FK Sabinov 3:0.</p><p>Tomáš Novák strelil dva góly a Richard Štefan pridal tretí. Vranov zostáva na druhom mieste tabuľky s 15 bodmi.</p>',
    category: 'výsledky', club: 'MFK Vranov nad Topľou',
    publishedAt: Timestamp.fromDate(new Date('2025-09-28')),
    active: true,
  },
  {
    title: 'Program 9. kola: Prvý jesenný test',
    slug: 'program-9-kola-prvy-jesenný-test',
    excerpt: 'Deviate kolo TIPOS III. ligy Východ prinesie zaujímavé súboje. Kľúčovým zápasom bude duel Košíc B s Humenným, kde sa stretnú dva tímy bojujúce o Top 4.',
    content: '<p>Nadchádzajúce 9. kolo prinesie fanúšikom zaujímavý futbal. Odohrajú sa všetky stretnutia v nedeľu 5. októbra 2025 o 16:30.</p><p>Najsledovanejším zápasom bude duel FC Košice B vs. FK Humenné, kde oba tímy bojujú o udržanie kontaktu s vedúcim Bardejovom.</p>',
    category: 'program', club: 'Liga',
    publishedAt: Timestamp.fromDate(new Date('2025-10-03')),
    active: true,
  },
  {
    title: 'Kováč: "Chceme vyhrať ligu bez zaváhania"',
    slug: 'kovac-chceme-vyhrat-ligu-bez-zavania',
    excerpt: 'Kanonír FK Bardejov Marek Kováč sa po víťazstve nad Humenným vyjadril k ambíciám tímu na túto sezónu. Lídrom tabuľky strelcov nechýba sebavedomie.',
    content: '<p>Marek Kováč je po ôsmich kolách jednoznačne najlepší strelec ligy s desiatimi gólmi. Po zápase s Humenným sme sa ho opýtali na ambície tímu.</p><p><em>"Tím je v skvelej forme a všetci veríme, že táto sezóna bude naša. Chceme vyhrať ligu bez zaváhania a postúpiť do druhej ligy,"</em> povedal s úsmevom Kováč.</p>',
    category: 'rozhovor', club: 'FK Bardejov',
    publishedAt: Timestamp.fromDate(new Date('2025-09-29')),
    active: true,
  },
  {
    title: 'Disciplinárna komisia udelila pokuty po 7. kole',
    slug: 'disciplinarna-komisia-udelila-pokuty-po-7-kole',
    excerpt: 'Disciplinárna komisia TIPOS III. ligy Východ prejednala viaceré priestupky z 7. kola. Celkovo udelila pokuty vo výške 850 €.',
    content: '<p>Disciplinárna komisia ligy zasadala v utorok a prejednala priestupky z 7. kola súťaže.</p><p>Udelila pokuty trom klubom za nevhodné správanie hráčov a fanúšikov. Súčasne potvrdila jednu karetný trest na jeden zápas.</p>',
    category: 'disciplinárne', club: 'Liga',
    publishedAt: Timestamp.fromDate(new Date('2025-09-23')),
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
  {
    name: 'TIPOS', tier: 'title', order: 1, active: true,
    website: 'https://tipos.sk',
    sections: ['homepage','fixtures','standings'],
    logoUrl: null,
  },
  {
    name: 'Kaufland Slovensko', tier: 'gold', order: 1, active: true,
    website: 'https://kaufland.sk',
    sections: ['homepage'],
    logoUrl: null,
  },
  {
    name: 'RegioJet', tier: 'silver', order: 1, active: true,
    website: 'https://regiojet.sk',
    sections: ['homepage'],
    logoUrl: null,
  },
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
  { name: 'Vladimír Krajči',  grade: 'Regionálna', region: 'Prešov',    phone: '+421 910 111 222', email: 'krajci@sfz.sk',  active: true },
  { name: 'Ján Beňo',         grade: 'Regionálna', region: 'Košice',    phone: '+421 911 222 333', email: 'beno@sfz.sk',    active: true },
  { name: 'Miroslav Havrila', grade: 'Oblastná',   region: 'Prešov',    phone: '+421 915 333 444', email: 'havrila@sfz.sk', active: true },
  { name: 'Tomáš Džunda',     grade: 'Oblastná',   region: 'Košice',    phone: '+421 948 444 555', email: 'dzunda@sfz.sk',  active: true },
  { name: 'Peter Maník',      grade: 'Regionálna', region: 'Bardejov',  phone: '+421 902 555 666', email: 'manik@sfz.sk',   active: true },
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
    playerName: 'Marek Kováč', club: 'FK Bardejov', goals: 4, assists: 1,
    votes: 312,
  },
  {
    season: '2025/26', monthKey: 'sep-2025', monthLabel: 'September 2025',
    playerName: 'Tomáš Novák', club: 'MFK Vranov nad Topľou', goals: 4, assists: 2,
    votes: 287,
  },
]

await step('awards_potm', async () => {
  for (const p of POTM) {
    await setDoc(doc(db, 'awards_potm', `2025-26_${p.monthKey}`), p)
  }
  return POTM.length
})

console.log('\n✅  Seed complete!\n')
process.exit(0)
