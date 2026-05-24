/**
 * trigger-standings.mjs
 * Writes a fixture document back to Firestore (no data change) to fire
 * the updateStandings Cloud Function and populate the standings collection.
 *
 * Usage:
 *   node scripts/trigger-standings.mjs <email> <password>
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, limit, query } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Firebase init ──────────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const [,, email, password] = process.argv
  if (!email || !password) {
    console.error('Usage: node scripts/trigger-standings.mjs <email> <password>')
    process.exit(1)
  }

  console.log('Signing in…')
  await signInWithEmailAndPassword(auth, email, password)
  console.log('✓ Signed in.')

  // Find one fixture doc to touch
  const snap = await getDocs(query(collection(db, 'fixtures'), limit(1)))
  if (snap.empty) {
    console.error('✗ No fixture documents found. Import fixtures first.')
    process.exit(1)
  }

  const fixtureRef = snap.docs[0].ref
  const fixtureId  = snap.docs[0].id
  console.log(`Touching fixture ${fixtureId} to trigger updateStandings…`)

  // Write the doc back with a _triggered timestamp — this fires the CF.
  // The Cloud Function ignores this field; it reads all fixtures fresh anyway.
  await updateDoc(fixtureRef, { _triggered: new Date().toISOString() })

  console.log('✓ Write complete. The updateStandings Cloud Function should fire within ~10s.')
  console.log('  Check the standings collection in the Firestore console, or run:')
  console.log('  firebase functions:log')

  process.exit(0)
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1) })
