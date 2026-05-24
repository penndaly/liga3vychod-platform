import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { getClubBySlug } from '../config/clubs-config'

export const TEAM_DEFS = [
  { id: 'U19', label: 'U19', sublabel: 'Starší dorast',  minAge: 15, maxAge: 19 },
  { id: 'U17', label: 'U17', sublabel: 'Mladší dorast',  minAge: 13, maxAge: 17 },
  { id: 'U15', label: 'U15', sublabel: 'Starší žiaci',   minAge: 11, maxAge: 15 },
  { id: 'U13', label: 'U13', sublabel: 'Mladší žiaci',   minAge: 9,  maxAge: 13 },
  { id: 'U11', label: 'U11', sublabel: 'Prípravka',      minAge: 7,  maxAge: 11 },
]

export function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d)) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

export function useAcademyTeam(clubSlug, teamId) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubSlug || !teamId) return
    const staticClub = getClubBySlug(clubSlug)
    if (!staticClub) { setLoading(false); return }
    const clubId = String(staticClub.id)

    const unsub = onSnapshot(
      collection(db, 'clubs', clubId, 'academy', teamId, 'players'),
      (snap) => {
        setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [clubSlug, teamId])

  return { players, loading }
}

// Fetches all 5 teams at once — use when you need a summary view.
export function useAcademyTeams(clubSlug) {
  const [teams,   setTeams]   = useState({ U19: [], U17: [], U15: [], U13: [], U11: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubSlug) return
    const staticClub = getClubBySlug(clubSlug)
    if (!staticClub) { setLoading(false); return }
    const clubId = String(staticClub.id)

    const teamIds = ['U19', 'U17', 'U15', 'U13', 'U11']
    let resolved = 0
    const acc = {}
    const unsubs = []

    teamIds.forEach((tid) => {
      const unsub = onSnapshot(
        collection(db, 'clubs', clubId, 'academy', tid, 'players'),
        (snap) => {
          acc[tid] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          resolved++
          if (resolved >= teamIds.length) {
            setTeams({ ...acc })
            setLoading(false)
          }
        },
        () => {
          acc[tid] = []
          resolved++
          if (resolved >= teamIds.length) {
            setTeams({ ...acc })
            setLoading(false)
          }
        }
      )
      unsubs.push(unsub)
    })

    return () => unsubs.forEach((u) => u())
  }, [clubSlug])

  return { teams, loading }
}
