/**
 * trigger-standings.mjs
 * Touches a document in the `fixtures` collection to fire the
 * updateStandings Cloud Function, then verifies the standings
 * collection has 14 documents.
 *
 * Usage:
 *   node scripts/trigger-standings.mjs <email> <password>
 *
 * Example:
 *   node scripts/trigger-standings.mjs arnieweiss@gmail.com 'password'
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  limit,
  query,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
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
const db   = getFirestore(app)
const auth = getAuth(app)

// ── Helpers ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const [,, email, password] = process.argv
  if (!email || !password) {
    console.error('Usage: node scripts/trigger-standings.mjs <email> <password>')
    process.exit(1)
  }

  // 1. Sign in
  console.log('🔐 Signing in…')
  await signInWithEmailAndPassword(auth, email, password)
  console.log('✓ Signed in as', email)

  // 2. Get any document from the fixtures collection
  console.log('\n📄 Fetching a document from the fixtures collection…')
  const snap = await getDocs(query(collection(db, 'fixtures'), limit(1)))
  if (snap.empty) {
    console.error('✗ No documents found in the fixtures collection.')
    console.error('  Make sure fixtures have been imported before running this script.')
    process.exit(1)
  }
  const resultRef = snap.docs[0].ref
  const resultId  = snap.docs[0].id
  console.log(`✓ Found fixture document: ${resultId}`)

  // 3. Update it with _triggerStandings: serverTimestamp()
  console.log('\n✍️  Writing _triggerStandings timestamp to trigger the Cloud Function…')
  await updateDoc(resultRef, { _triggerStandings: serverTimestamp() })
  console.log('✓ Write complete.')

  // 4. Wait 5 seconds for the Cloud Function to execute
  console.log('\n⏳ Waiting 5 seconds for the Cloud Function to execute…')
  for (let i = 5; i >= 1; i--) {
    process.stdout.write(`   ${i}…\r`)
    await sleep(1000)
  }
  process.stdout.write('             \r') // clear countdown line

  // 5. Verify the standings collection has 14 documents
  console.log('🔍 Verifying standings collection…')
  const standingsSnap = await getDocs(collection(db, 'standings'))
  const count = standingsSnap.size

  // Expected: 14 club docs + 1 _meta doc = 15 total
  if (count === 15) {
    // 6. Print success message
    console.log(`✅ Success! standings collection has ${count} documents (14 clubs + _meta).`)
    console.log('   The updateStandings Cloud Function ran correctly.')
  } else if (count === 0) {
    console.error('✗ standings collection is still empty.')
    console.error('  The Cloud Function may not have fired yet or there was an error.')
    console.error('  Check the logs with: firebase functions:log')
    process.exit(1)
  } else {
    console.warn(`⚠️  standings collection has ${count} document(s) — expected 15 (14 clubs + _meta).`)
    console.warn('  Run scripts/find-club-mismatch.mjs to check for club name typos.')
    console.warn('  Or check the logs with: firebase functions:log')
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err.message ?? err)
  process.exit(1)
})
