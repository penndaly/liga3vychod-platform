import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import { CLUBS } from '../data/placeholder'
import { computeStandings } from '../utils/standings'

export function useClubData(slug) {
  const [state, setState] = useState({
    club: null, profile: null, players: [],
    fixtures: [], standings: [], news: [], playerStats: [],
    loading: true, error: null,
  })

  useEffect(() => {
    if (!slug) return
    const staticClub = CLUBS.find((c) => c.slug === slug)
    if (!staticClub) {
      setState((s) => ({ ...s, loading: false, error: 'Klub nenájdený' }))
      return
    }

    let cancelled = false
    async function load() {
      try {
        const [profileSnap, playersSnap, fxSnap, dedSnap, newsSnap, statsSnap] = await Promise.all([
          getDoc(doc(db, 'clubs', String(staticClub.id))),
          getDocs(collection(db, 'clubs', String(staticClub.id), 'players')),
          getDocs(collection(db, 'fixtures')),
          getDocs(collection(db, 'deductions')),
          getDocs(query(collection(db, 'news'), where('club', '==', staticClub.name))),
          getDocs(query(collection(db, 'player_stats'), where('club', '==', staticClub.name))),
        ])
        if (cancelled) return

        const allFixtures = fxSnap.docs.map((d) => d.data())
        const deductions  = dedSnap.docs.map((d) => d.data())
        const clubFixtures = allFixtures
          .filter((f) => f.home === staticClub.name || f.away === staticClub.name)
          .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))

        setState({
          club:        staticClub,
          profile:     profileSnap.exists() ? profileSnap.data() : null,
          players:     playersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          fixtures:    clubFixtures,
          standings:   computeStandings(allFixtures, deductions),
          news:        newsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          playerStats: statsSnap.docs.map((d) => d.data()),
          loading:     false,
          error:       null,
        })
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message }))
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  return state
}
