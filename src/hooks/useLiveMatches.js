import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'

/**
 * Returns all fixtures with real-time updates, sorted by round.
 * The page filters by status client-side so live, completed, and upcoming
 * are all available from one listener.
 */
export function useLiveMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubs = []

    const attach = (q) => {
      const unsub = onSnapshot(q, (snap) => {
        setMatches(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || (a.home ?? '').localeCompare(b.home ?? '')),
        )
        setLoading(false)
      }, () => {
        // index not ready — fall back to unordered collection scan
        const fallback = onSnapshot(collection(db, 'fixtures'), (snap) => {
          setMatches(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.round ?? 0) - (b.round ?? 0)),
          )
          setLoading(false)
        })
        unsubs.push(fallback)
      })
      unsubs.push(unsub)
    }

    attach(query(collection(db, 'fixtures'), orderBy('round')))

    return () => unsubs.forEach((u) => u())
  }, [])

  return { matches, loading }
}
