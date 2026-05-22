import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { firebaseConfig } from './firebase'

const SECONDARY_NAME = 'secondary-admin'

function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === SECONDARY_NAME)
  return getAuth(existing ?? initializeApp(firebaseConfig, SECONDARY_NAME))
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Creates a Firebase Auth user without affecting the currently signed-in admin session.
// Sends a password-reset email so the new user sets their own password.
export async function createFirebaseUser(email) {
  const secondaryAuth = getSecondaryAuth()
  const { user } = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    generateTempPassword()
  )
  await sendPasswordResetEmail(secondaryAuth, email)
  await secondaryAuth.signOut()
  return user.uid
}
