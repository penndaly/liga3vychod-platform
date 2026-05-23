const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

// Full club name list — must match exactly what is stored in fixture home/away fields
const CLUB_NAMES = [
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

// Recalculates full standings whenever any fixture doc is created or updated.
// Mirrors the client-side computeStandings() logic in src/utils/standings.js,
// including point deductions.
exports.updateStandings = onDocumentWritten('fixtures/{fixtureId}', async () => {
  const [fixturesSnap, deductionsSnap] = await Promise.all([
    db.collection('fixtures').get(),
    db.collection('deductions').get(),
  ])

  const fixtures = fixturesSnap.docs.map((d) => d.data())
  const deductions = deductionsSnap.docs.map((d) => d.data())

  // Seed every known club so teams with 0 played still appear in standings
  const teams = {}
  CLUB_NAMES.forEach((name) => {
    teams[name] = { club: name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, deduction: 0, form: [] }
  })

  // Any club appearing in fixtures but missing from the seed list still gets a row
  fixtures.forEach((m) => {
    if (m.home && !teams[m.home]) teams[m.home] = { club: m.home, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, deduction: 0, form: [] }
    if (m.away && !teams[m.away]) teams[m.away] = { club: m.away, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, deduction: 0, form: [] }
  })

  // Process completed matches in round order so form guide is chronological
  fixtures
    .filter((m) => m.status === 'completed' && m.homeGoals != null && m.awayGoals != null)
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
    .forEach((m) => {
      const home = teams[m.home]
      const away = teams[m.away]
      if (!home || !away) return

      const hg = m.homeGoals
      const ag = m.awayGoals

      home.p++; away.p++
      home.gf += hg; home.ga += ag
      away.gf += ag; away.ga += hg

      if (hg > ag) {
        home.w++; home.pts += 3; away.l++
        home.form.push('W'); away.form.push('L')
      } else if (hg < ag) {
        away.w++; away.pts += 3; home.l++
        home.form.push('L'); away.form.push('W')
      } else {
        home.d++; home.pts++; away.d++; away.pts++
        home.form.push('D'); away.form.push('D')
      }
    })

  // Apply point deductions (positive value = penalty)
  deductions.forEach((d) => {
    if (teams[d.club]) teams[d.club].deduction += d.points
  })

  // Sort: finalPts → GD → GF → alphabetical (same tiebreaker order as client)
  const sorted = Object.values(teams)
    .map((t) => ({
      ...t,
      gd: t.gf - t.ga,
      finalPts: t.pts - t.deduction,
      form: t.form.slice(-5),
    }))
    .sort((a, b) => {
      if (b.finalPts !== a.finalPts) return b.finalPts - a.finalPts
      if (b.gd !== a.gd) return b.gd - a.gd
      if (b.gf !== a.gf) return b.gf - a.gf
      return a.club.localeCompare(b.club)
    })
    .map((t, i) => ({ ...t, pos: i + 1 }))

  // Batch-write one doc per club + a _meta doc
  const batch = db.batch()
  sorted.forEach((entry) => {
    batch.set(db.collection('standings').doc(entry.club), {
      ...entry,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
  batch.set(db.collection('standings').doc('_meta'), {
    updatedAt: FieldValue.serverTimestamp(),
    completedMatches: fixtures.filter((m) => m.status === 'completed').length,
  })
  await batch.commit()

  console.log(`Standings updated: ${sorted.length} clubs, ${fixtures.filter((m) => m.status === 'completed').length} completed matches`)
})
