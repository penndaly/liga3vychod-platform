const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
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

// ── sendOrderStatusEmail ───────────────────────────────────────────────────
// Callable function: sends a transactional email to the customer when their
// order status changes. Requires an email provider (SendGrid, Mailgun, etc.)
// to be configured — see the TODO below.
//
// Call from the client:
//   const fn = httpsCallable(getFunctions(), 'sendOrderStatusEmail')
//   await fn({ orderId, clubSlug, newStatus })

const EMAIL_TEMPLATES = {
  processing: (order) => ({
    subject: `Vaša objednávka #${order.orderNumber} je v spracovaní`,
    text: [
      `Dobrý deň ${order.customerName},`,
      '',
      `Vaša objednávka #${order.orderNumber} bola prijatá a momentálne ju spracovávame.`,
      'O ďalšom postupe vás budeme informovať e-mailom.',
      '',
      'Ďakujeme za váš nákup!',
    ].join('\n'),
  }),
  shipped: (order) => ({
    subject: `Vaša objednávka #${order.orderNumber} bola odoslaná`,
    text: [
      `Dobrý deň ${order.customerName},`,
      '',
      `Vaša objednávka #${order.orderNumber} bola odoslaná.`,
      order.trackingNumber ? `Číslo zásielky: ${order.trackingNumber}` : '',
      order.carrier        ? `Dopravca: ${order.carrier}`              : '',
      order.estimatedDelivery ? `Predpokladané doručenie: ${order.estimatedDelivery}` : '',
      '',
      'Ďakujeme za váš nákup!',
    ].filter((l) => l !== '').join('\n'),
  }),
  delivered: (order) => ({
    subject: `Objednávka #${order.orderNumber} bola doručená`,
    text: [
      `Dobrý deň ${order.customerName},`,
      '',
      `Vaša objednávka #${order.orderNumber} bola úspešne doručená.`,
      'Dúfame, že ste spokojní s vaším nákupom!',
      '',
      'Ďakujeme za podporu klubu.',
    ].join('\n'),
  }),
}

exports.sendOrderStatusEmail = onCall(async (request) => {
  const { orderId, clubSlug, newStatus } = request.data

  if (!orderId || !clubSlug || !newStatus) {
    throw new HttpsError('invalid-argument', 'orderId, clubSlug and newStatus are required')
  }

  // Fetch the order — try numeric clubId first, then treat clubSlug as the doc id
  let orderSnap = null
  try {
    orderSnap = await db.collection('clubs').doc(clubSlug).collection('orders').doc(orderId).get()
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', `Order ${orderId} not found under club ${clubSlug}`)
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', `Firestore error: ${err.message}`)
  }

  const order    = orderSnap.data()
  const template = EMAIL_TEMPLATES[newStatus]

  if (!template) {
    // No email needed for this status (e.g. 'cancelled' — handle separately if desired)
    return { success: true, skipped: true, reason: 'no template for status' }
  }

  const { subject, text } = template(order)

  // ── TODO: plug in your email provider here ───────────────────────────
  // Option A — SendGrid:
  //   const sgMail = require('@sendgrid/mail')
  //   sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  //   await sgMail.send({ to: order.customerEmail, from: 'shop@yourdomain.sk', subject, text })
  //
  // Option B — Nodemailer (SMTP):
  //   const nodemailer = require('nodemailer')
  //   const transporter = nodemailer.createTransport({ ... })
  //   await transporter.sendMail({ to: order.customerEmail, from: 'shop@yourdomain.sk', subject, text })
  //
  // Option C — Firebase Extension "Trigger Email":
  //   await db.collection('mail').add({ to: order.customerEmail, message: { subject, text } })
  // ─────────────────────────────────────────────────────────────────────

  console.log(`[sendOrderStatusEmail] Would send "${subject}" to ${order.customerEmail}`)
  console.log(text)

  return { success: true, to: order.customerEmail, subject }
})
