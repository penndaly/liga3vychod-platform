const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')
const path = require('path')
const os   = require('os')
const fs   = require('fs')

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

// ── generateHighlightsVideo ────────────────────────────────────────────────
// Callable function: cuts highlight clips from a recorded stream using FFmpeg,
// concatenates them, and uploads the result to Firebase Storage.
//
// Requirements:
//   - The full stream recording must be uploaded to Storage at:
//       streams/{streamId}.mp4
//   - fluent-ffmpeg and ffmpeg-static must be installed (see package.json)
//
// Call from the client:
//   const fn = httpsCallable(getFunctions(), 'generateHighlightsVideo')
//   await fn({ streamId, clips: [{ start, end, label }], clubId })
//
// The generated highlights file is saved to:
//   highlights/{clubId}/{streamId}_highlights.mp4
// and a download URL is written back to:
//   clubs/{clubId}/highlight_exports/{jobId}

exports.generateHighlightsVideo = onCall(
  // Allocate extra memory and timeout for video processing
  { memory: '2GiB', timeoutSeconds: 540 },
  async (request) => {
    const { streamId, clips, clubId } = request.data

    if (!streamId || !clips || !Array.isArray(clips) || !clubId) {
      throw new HttpsError('invalid-argument', 'streamId, clubId and clips[] are required')
    }
    if (clips.length === 0) {
      throw new HttpsError('invalid-argument', 'clips array must not be empty')
    }

    // ── Create a job document so the client can track progress ──────────
    const jobRef = db.collection('clubs').doc(String(clubId)).collection('highlight_exports').doc()
    await jobRef.set({
      streamId,
      clipCount: clips.length,
      status:    'processing',
      createdAt: FieldValue.serverTimestamp(),
      requestedBy: request.auth?.uid ?? null,
    })
    const jobId = jobRef.id

    try {
      // ── Lazy-load FFmpeg (only installed in the functions environment) ─
      let ffmpeg, ffmpegPath
      try {
        ffmpeg     = require('fluent-ffmpeg')
        ffmpegPath = require('ffmpeg-static')
        ffmpeg.setFfmpegPath(ffmpegPath)
      } catch {
        // FFmpeg not available — mark job as pending for manual processing
        await jobRef.update({ status: 'pending_ffmpeg', updatedAt: FieldValue.serverTimestamp() })
        console.warn('[generateHighlightsVideo] fluent-ffmpeg not available; job queued as pending_ffmpeg')
        return { success: true, jobId, queued: true, message: 'FFmpeg unavailable; job queued.' }
      }

      const bucket    = getStorage().bucket()
      const tmpDir    = os.tmpdir()
      const srcPath   = path.join(tmpDir, `${streamId}.mp4`)
      const outPath   = path.join(tmpDir, `highlights_${streamId}.mp4`)
      const concatList = path.join(tmpDir, `concat_${streamId}.txt`)

      // ── Download source video ─────────────────────────────────────────
      const srcFile = bucket.file(`streams/${streamId}.mp4`)
      const [exists] = await srcFile.exists()
      if (!exists) {
        await jobRef.update({ status: 'error', error: 'Source stream file not found in Storage', updatedAt: FieldValue.serverTimestamp() })
        throw new HttpsError('not-found', `streams/${streamId}.mp4 not found in Storage`)
      }
      await srcFile.download({ destination: srcPath })
      console.log(`[generateHighlightsVideo] Downloaded source: ${srcPath}`)

      // ── Cut individual segments ───────────────────────────────────────
      const segmentFiles = []
      for (let i = 0; i < clips.length; i++) {
        const clip   = clips[i]
        const start  = Math.max(0, clip.start)
        const duration = Math.max(1, clip.end - start)
        const segPath = path.join(tmpDir, `seg_${streamId}_${i}.mp4`)

        await new Promise((resolve, reject) => {
          ffmpeg(srcPath)
            .setStartTime(start)
            .setDuration(duration)
            // Re-encode with fast settings for accurate seeking
            .outputOptions(['-c:v libx264', '-preset ultrafast', '-c:a aac', '-avoid_negative_ts make_zero'])
            .output(segPath)
            .on('end',   resolve)
            .on('error', (err) => reject(new Error(`Segment ${i} failed: ${err.message}`)))
            .run()
        })
        segmentFiles.push(segPath)
        console.log(`[generateHighlightsVideo] Segment ${i + 1}/${clips.length} cut`)
      }

      // ── Build concat list and merge ───────────────────────────────────
      const concatContent = segmentFiles.map((f) => `file '${f}'`).join('\n')
      fs.writeFileSync(concatList, concatContent)

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatList)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions(['-c copy'])
          .output(outPath)
          .on('end',   resolve)
          .on('error', (err) => reject(new Error(`Concat failed: ${err.message}`)))
          .run()
      })
      console.log(`[generateHighlightsVideo] Concatenation complete: ${outPath}`)

      // ── Upload highlights to Storage ──────────────────────────────────
      const destPath = `highlights/${clubId}/${streamId}_highlights.mp4`
      await bucket.upload(outPath, {
        destination: destPath,
        metadata:    { contentType: 'video/mp4' },
      })

      // Generate a signed URL valid for 7 days
      const [downloadUrl] = await bucket.file(destPath).getSignedUrl({
        action:  'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })

      // ── Update job document with result ──────────────────────────────
      await jobRef.update({
        status:       'complete',
        downloadUrl,
        storagePath:  destPath,
        updatedAt:    FieldValue.serverTimestamp(),
      })

      // ── Cleanup temp files ────────────────────────────────────────────
      ;[srcPath, outPath, concatList, ...segmentFiles].forEach((f) => {
        try { fs.unlinkSync(f) } catch { /* ignore */ }
      })

      console.log(`[generateHighlightsVideo] Job ${jobId} complete. URL: ${downloadUrl}`)
      return { success: true, jobId, downloadUrl }

    } catch (err) {
      // Update job with error state — don't rethrow so the client gets a clean error object
      await jobRef.update({
        status:    'error',
        error:     err.message,
        updatedAt: FieldValue.serverTimestamp(),
      }).catch(() => {})

      if (err instanceof HttpsError) throw err
      throw new HttpsError('internal', err.message)
    }
  }
)
