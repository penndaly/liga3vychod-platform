import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { Calendar, Clock, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../services/firebase'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const STATUS = {
  scheduled: { label: 'Plánovaný',  cls: 'bg-slate-700 text-slate-300' },
  live:      { label: 'LIVE',       cls: 'bg-red-500/20 text-red-400 animate-pulse' },
  completed: { label: 'Odohraný',   cls: 'bg-green-500/20 text-green-400' },
  postponed: { label: 'Odložený',   cls: 'bg-yellow-400/20 text-yellow-400' },
}

const TABS = [
  { key: 'upcoming', label: 'Program' },
  { key: 'results',  label: 'Výsledky' },
  { key: 'all',      label: 'Všetky' },
]

function MatchRow({ match }) {
  const isScored  = match.status === 'completed' || match.status === 'live'
  const isLive    = match.status === 'live'
  const homeWon   = isScored && match.homeGoals > match.awayGoals
  const awayWon   = isScored && match.awayGoals > match.homeGoals
  const clickable = isScored && match.id

  const inner = (
    <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-slate-800/50 transition-colors border-b border-slate-800/60 last:border-0">

      {/* Home */}
      <div className="flex-1 text-right min-w-0">
        <span className={`text-sm leading-tight block truncate ${homeWon ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
          {match.home}
        </span>
      </div>

      {/* Score / VS */}
      <div className="shrink-0 w-20 sm:w-24 flex justify-center">
        {isScored ? (
          <div className={`px-3 py-1.5 rounded-lg font-black text-sm tabular-nums ${isLive ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' : 'bg-slate-950 text-white'}`}>
            {match.homeGoals ?? 0}&nbsp;–&nbsp;{match.awayGoals ?? 0}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-slate-600 text-xs font-black uppercase">vs</span>
            {match.time && (
              <span className="flex items-center gap-0.5 text-green-500 text-xs font-bold">
                <Clock size={9} />{match.time}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm leading-tight block truncate ${awayWon ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
          {match.away}
        </span>
      </div>

      {/* Date + status — right column */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 w-28 shrink-0">
        {match.date && (
          <span className="flex items-center gap-1 text-slate-600 text-xs">
            <Calendar size={9} />{match.date}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
            <Radio size={9} /> LIVE
          </span>
        )}
      </div>
    </div>
  )

  if (clickable) {
    return (
      <Link to={`/vysledky/${match.id}`} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}

function RoundGroup({ round, matches }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/40">
        <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
          {round}. kolo
        </span>
        {matches[0]?.date && (
          <span className="text-xs text-slate-600">{matches[0].date}</span>
        )}
      </div>
      {matches.map((m, i) => <MatchRow key={i} match={m} />)}
    </div>
  )
}

function SkeletonRound() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-800/60" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-800/60">
          <div className="flex-1 h-4 bg-slate-800 rounded" />
          <div className="w-20 h-8 bg-slate-800 rounded-lg" />
          <div className="flex-1 h-4 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('upcoming')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'fixtures'))
        setFixtures(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped = useMemo(() => {
    let list = [...fixtures]
    if (tab === 'upcoming') {
      list = list.filter((f) => f.status === 'scheduled' || f.status === 'postponed')
      list.sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
    } else if (tab === 'results') {
      list = list.filter((f) => f.status === 'completed' || f.status === 'live')
      list.sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
    } else {
      list.sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
    }

    const map = {}
    list.forEach((f) => {
      const r = f.round ?? '?'
      if (!map[r]) map[r] = []
      map[r].push(f)
    })
    return Object.entries(map).map(([round, matches]) => ({ round: Number(round) || round, matches }))
  }, [fixtures, tab])

  const liveCount = fixtures.filter((f) => f.status === 'live').length

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={13} className="text-yellow-400" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Zápasy</span>
          </div>
          <h1 className="text-3xl font-black text-white">Program a výsledky</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wide rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-yellow-400 text-slate-950'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {t.key === 'upcoming' && liveCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full">
                  {liveCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonRound key={i} />)}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-700">
            <Calendar size={36} className="mb-3 opacity-40" />
            <p className="text-sm font-bold">Žiadne zápasy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ round, matches }) => (
              <RoundGroup key={round} round={round} matches={matches} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
