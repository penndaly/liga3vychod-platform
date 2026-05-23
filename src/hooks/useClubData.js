import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import { CLUBS_2025_26 } from '../config/clubs-config'
import { computeStandings } from '../utils/standings'
import { useAuth } from './useAuth'

export function useClubData(slug) {
  const { isSuperadmin, userData, loading: authLoading } = useAuth()
  const [state, setState] = useState({
    club: null, profile: null, players: [],
    fixtures: [], standings: [], news: [], playerStats: [],
    loading: true, error: null,
  })

  useEffect(() => {
    if (!slug || authLoading) return

    const staticClub = CLUBS_2025_26.find((c) => c.slug === slug)
    if (!staticClub) {
      setState((s) => ({ ...s, loading: false, error: 'Klub nenájdený' }))
      return
    }

    const userClubs = userData?.clubs ?? []
    if (!isSuperadmin && !userClubs.includes(staticClub.name)) {
      console.error('Unauthorized access attempt to club:', slug)
      setState((s) => ({ ...s, loading: false, error: 'Unauthorized' }))
      return
    }

    const clubIdStr = String(staticClub.id)
    const unsubs = []

    // Shared accumulators so each listener can merge into common state
    const acc = {
      profile:     null,
      players:     [],
      allFixtures: [],
      deductions:  [],
      news:        [],
      playerStats: [],
    }

    let initialised = 0
    const TOTAL = 6

    function push() {
      initialised++
      if (initialised < TOTAL) return
      const clubFixtures = acc.allFixtures
        .filter((f) => f.home === staticClub.name || f.away === staticClub.name)
        .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))

      setState({
        club:        staticClub,
        profile:     acc.profile,
        players:     acc.players,
        fixtures:    clubFixtures,
        standings:   computeStandings(acc.allFixtures, acc.deductions),
        news:        acc.news,
        playerStats: acc.playerStats,
        loading:     false,
        error:       null,
      })
    }

    function update(key, value) {
      acc[key] = value
      if (initialised >= TOTAL) {
        // Already live — recompute and push update
        const clubFixtures = acc.allFixtures
          .filter((f) => f.home === staticClub.name || f.away === staticClub.name)
          .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
        setState({
          club:        staticClub,
          profile:     acc.profile,
          players:     acc.players,
          fixtures:    clubFixtures,
          standings:   computeStandings(acc.allFixtures, acc.deductions),
          news:        acc.news,
          playerStats: acc.playerStats,
          loading:     false,
          error:       null,
        })
      } else {
        push()
      }
    }

    function onErr(err) {
      setState((s) => ({ ...s, loading: false, error: err.message }))
    }

    // 1. Club profile doc
    unsubs.push(onSnapshot(doc(db, 'clubs', clubIdStr), (snap) => {
      update('profile', snap.exists() ? snap.data() : null)
    }, onErr))

    // 2. Players subcollection
    unsubs.push(onSnapshot(collection(db, 'clubs', clubIdStr, 'players'), (snap) => {
      update('players', snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, onErr))

    // 3. All fixtures (needed for full standings computation)
    unsubs.push(onSnapshot(collection(db, 'fixtures'), (snap) => {
      update('allFixtures', snap.docs.map((d) => d.data()))
    }, onErr))

    // 4. Deductions
    unsubs.push(onSnapshot(collection(db, 'deductions'), (snap) => {
      update('deductions', snap.docs.map((d) => d.data()))
    }, onErr))

    // 5. Club news
    unsubs.push(onSnapshot(
      query(collection(db, 'news'), where('club', '==', staticClub.name)),
      (snap) => { update('news', snap.docs.map((d) => ({ id: d.id, ...d.data() }))) },
      () => { update('news', []) }  // index might be missing — graceful fallback
    ))

    // 6. Player stats for this club
    unsubs.push(onSnapshot(
      query(collection(db, 'player_stats'), where('club', '==', staticClub.name)),
      (snap) => { update('playerStats', snap.docs.map((d) => d.data())) },
      () => { update('playerStats', []) }
    ))

    return () => unsubs.forEach((u) => u())
  }, [slug, isSuperadmin, userData, authLoading])

  return state
}
