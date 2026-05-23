import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Target, HelpingHand, BookOpen, Square, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const SEASONS = ['2025/26', '2024/25', '2023/24']

const RANK_CLS = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
}

// Map club name → CLUBS entry id for linking to club profile
const CLUB_ID_MAP = Object.fromEntries(CLUBS.map((c) => [c.name, c.id]))

function findClubId(clubName) {
  return CLUB_ID_MAP[clubName] ?? null
}

function LeaderboardTable({ players, sortKey, unit, emptyLabel }) {
  const sorted = useMemo(
    () =>
      [...players]
        .filter((p) => (p[sortKey] ?? 0) > 0)
        .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))
        .slice(0, 20),
    [players, sortKey]
  )

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-700 text-sm font-bold">
        {emptyLabel ?? 'Žiadne záznamy'}
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-800/60">
      {sorted.map((player, idx) => {
        const rank = idx + 1
        const clubId = findClubId(player.club)
        return (
          <div
            key={`${player.name}-${player.club}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/40 transition-colors"
          >
            <span className={`w-7 text-center text-sm font-black shrink-0 ${RANK_CLS[rank] ?? 'text-slate-600'}`}>
              {rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{player.name}</p>
              {player.club && (
                clubId ? (
                  <Link
                    to={`/kluby/${clubId}`}
                    className="text-xs text-slate-500 hover:text-yellow-400 transition-colors truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {player.club}
                  </Link>
                ) : (
                  <span className="text-xs text-slate-600 truncate block">{player.club}</span>
                )
              )}
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className={`text-xl font-black ${RANK_CLS[rank] ?? 'text-slate-300'}`}>
                {player[sortKey] ?? 0}
              </span>
              <span className="text-xs text-slate-600">{unit}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatPanel({ icon: Icon, title, color, children }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-2.5 px-5 py-4 border-b border-slate-800`}>
        <Icon size={14} className={color} />
        <h2 className={`text-xs font-black uppercase tracking-widest ${color}`}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function SeasonPicker({ value, onChange }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2 pr-8 outline-none focus:border-yellow-400 cursor-pointer transition-colors"
      >
        {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="divide-y divide-slate-800/60 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <div className="w-7 h-5 bg-slate-800 rounded" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </div>
          <div className="h-6 w-10 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function StatsPage() {
  const [season,  setSeason]  = useState(SEASONS[0])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setPlayers([])
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'player_stats'), where('season', '==', season))
        )
        setPlayers(snap.docs.map((d) => d.data()))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [season])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={13} className="text-yellow-400" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Štatistiky</span>
            </div>
            <h1 className="text-3xl font-black text-white">Hráčske štatistiky</h1>
          </div>
          <SeasonPicker value={season} onChange={setSeason} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <StatPanel icon={Target} title="Tabuľka strelcov" color="text-green-400">
            {loading ? <SkeletonTable /> : (
              <LeaderboardTable players={players} sortKey="goals" unit="gólov" emptyLabel="Žiadne góly" />
            )}
          </StatPanel>

          <StatPanel icon={HelpingHand} title="Tabuľka asistentov" color="text-blue-400">
            {loading ? <SkeletonTable /> : (
              <LeaderboardTable players={players} sortKey="assists" unit="asistencií" emptyLabel="Žiadne asistencie" />
            )}
          </StatPanel>

          <StatPanel icon={BookOpen} title="Žlté karty" color="text-yellow-400">
            {loading ? <SkeletonTable /> : (
              <LeaderboardTable players={players} sortKey="yellowCards" unit="ŽK" emptyLabel="Žiadne žlté karty" />
            )}
          </StatPanel>

          <StatPanel icon={Square} title="Červené karty" color="text-red-400">
            {loading ? <SkeletonTable /> : (
              <LeaderboardTable players={players} sortKey="redCards" unit="ČK" emptyLabel="Žiadne červené karty" />
            )}
          </StatPanel>

        </div>

        {!loading && players.length === 0 && (
          <div className="mt-8 text-center text-slate-600 text-sm font-bold">
            Žiadne štatistiky pre sezónu {season}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
