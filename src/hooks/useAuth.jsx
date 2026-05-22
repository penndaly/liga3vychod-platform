import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

const USERS_COL = 'users'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, USERS_COL, firebaseUser.uid))
          setUserData(snap.exists() ? snap.data() : null)
        } catch {
          setUserData(null)
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const isSuperadmin = userData?.role === 'SUPERADMIN'

  const isClubAdmin = (clubSlug) =>
    isSuperadmin ||
    (userData?.role === 'CLUB_ADMIN' && userData?.clubs?.includes(clubSlug))

  // For MVP: SUPERADMIN has everything; CLUB_ADMIN has all permissions on assigned clubs.
  // Fine-grained resource/action checks should be enforced via Cloud Functions / Security Rules.
  const hasPermission = (clubSlug, _resource, _action) => {
    if (isSuperadmin) return true
    return isClubAdmin(clubSlug)
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, isSuperadmin, isClubAdmin, hasPermission, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
