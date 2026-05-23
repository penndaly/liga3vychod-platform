import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { CLUBS_2025_26 } from '../../config/clubs-config'
import { Trophy, Shield, ShieldCheck, Users } from 'lucide-react'

export default function ClubPerformanceTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'fixtures'), where('status', '==', 'completed'))
        )
        const fixtures = snap.docs.map((d) => d.data())

        const clubStats = CLUBS_2025_26.map((club) => {
          let goalsFor = 0
          let goalsAgainst = 0
          let cleanSheets = 0
          let played = 0

          fixtures.forEach((f) => {
            const hg = f.homeGoals ?? 0
            const ag = f.awayGoals ?? 0
            if (f.home === club.name) {
              goalsFor += hg; goalsAgainst += ag
              if (ag === 0) cleanSheets++
              played++
            } else if (f.away === club.name) {
              goalsFor += ag; goalsAgainst += hg
              if (hg === 0) cleanSheets++
              played++
            }
          })

          return { ...club, goalsFor, goalsAgainst, cleanSheets, played }
        })

        const active = clubStats.filter((c) => c.played > 0)
        if (!active.length) { setStats(null); setLoading(false); return }

        setStats({
          bestAttack:      active.reduce((a, b) => b.goalsFor > a.goalsFor ? b : a),
          bestDefense:     active.reduce((a, b) => b.goalsAgainst < a.goalsAgainst ? b : a),
          mostCleanSheets: active.reduce((a, b) => b.cleanSheets > a.cleanSheets ? b : a),
        })
      } catch (e) {
        console.error(e)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="py-16 text-center text-sm text-slate-400 font-bold">Načítavam…</div>
  )

  if (!stats) return (
    <div className="py-16 text-center text-sm text-slate-400 font-bold">
      Žiadne odohraté zápasy
    </div>
  )

  const cards = [
    {
      label:   'Najlepší útok',
      club:    stats.bestAttack,
      value:   `${stats.bestAttack.goalsFor} gólov`,
      Icon:    Trophy,
      iconCls: 'text-yellow-400',
    },
    {
      label:   'Najlepšia obrana',
      club:    stats.bestDefense,
      value:   `${stats.bestDefense.goalsAgainst} inkasovaných`,
      Icon:    Shield,
      iconCls: 'text-green-600',
    },
    {
      label:   'Najviac čistých kont',
      club:    stats.mostCleanSheets,
      value:   `${stats.mostCleanSheets.cleanSheets} čistých kont`,
      Icon:    ShieldCheck,
      iconCls: 'text-green-600',
    },
    {
      label:       'Návštevnosť',
      club:        null,
      value:       'Coming soon',
      Icon:        Users,
      iconCls:     'text-slate-400',
      placeholder: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map(({ label, club, value, Icon, iconCls, placeholder }) => (
        <div
          key={label}
          className={`bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 ${
            placeholder ? 'opacity-50' : ''
          }`}
        >
          {club ? (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: club.color }}
            >
              {club.short}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-slate-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              {label}
            </p>
            <p className="text-sm font-black text-slate-900 truncate">{club?.name ?? '—'}</p>
            <p className="text-xs text-slate-500">{value}</p>
          </div>

          {club && <Icon size={22} className={`shrink-0 ${iconCls}`} />}
        </div>
      ))}
    </div>
  )
}
