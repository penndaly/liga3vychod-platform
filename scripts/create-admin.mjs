/**
 * One-time script to create the first SUPERADMIN account.
 * Run: node scripts/create-admin.mjs <email> <password> [displayName]
 *
 * Requires Email/Password auth to be enabled in the Firebase console first.
 */
import { initializeApp }                           from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc }               from 'firebase/firestore'
import { readFileSync }                            from 'fs'
import { resolve, dirname }                        from 'path'
import { fileURLToPath }                           from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath   = resolve(__dirname, '..', '.env')

// Parse .env manually (no dotenv dependency needed)
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const config = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
}

const [,, email, password, displayName = 'Super Admin'] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [displayName]')
  process.exit(1)
}

const app  = initializeApp(config)
const auth = getAuth(app)
const db   = getFirestore(app)

try {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)

  await setDoc(doc(db, 'users', user.uid), {
    email,
    name:      displayName,
    role:      'SUPERADMIN',
    clubs:     [],
    createdAt: new Date().toISOString(),
  })

  console.log(`\n✓ Admin account created`)
  console.log(`  Email : ${email}`)
  console.log(`  UID   : ${user.uid}`)
  console.log(`  Role  : SUPERADMIN\n`)
} catch (err) {
  console.error('\n✗ Error:', err.code ?? err.message)
  if (err.code === 'auth/email-already-in-use') {
    console.error('  That email already has an account.')
  } else if (err.code === 'auth/configuration-not-found') {
    console.error('  Email/Password sign-in is not enabled in the Firebase console.')
    console.error('  → https://console.firebase.google.com/project/liga3vychod-platform/authentication')
  }
  process.exit(1)
}

process.exit(0)
