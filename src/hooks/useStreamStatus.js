import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'

/**
 * Real-time stream status for a club.
 * Watches clubs/{clubId}/broadcast/stream.
 *
 * @param {string|null} clubId – numeric club id as string (e.g. "7")
 * @returns {{ isLive, isPaused, viewers, startedAt, currentMatch, loading }}
 */
export function useStreamStatus(clubId) {
  const [status, setStatus] = useState({
    isLive:       false,
    isPaused:     false,
    viewers:      0,
    startedAt:    null,
    endedAt:      null,
    duration:     0,
    currentMatch: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubId) { setLoading(false); return }

    const ref = doc(db, 'clubs', clubId, 'broadcast', 'stream')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          setStatus({
            isLive:       d.status === 'live',
            isPaused:     d.status === 'paused',
            viewers:      d.viewerCount ?? 0,
            startedAt:    d.startedAt   ?? null,
            endedAt:      d.endedAt     ?? null,
            duration:     d.duration    ?? 0,
            currentMatch: d.currentMatch ?? null,
          })
        } else {
          setStatus({ isLive: false, isPaused: false, viewers: 0, startedAt: null, endedAt: null, duration: 0, currentMatch: null })
        }
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [clubId])

  return { ...status, loading }
}
