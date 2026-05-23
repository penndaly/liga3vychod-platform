import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Calendar, Clock } from 'lucide-react'
import { db } from '../../services/firebase'
import { getClubByName } from '../../config/clubs-config'

function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 border-l-2 border-yellow-400 pl-3">
        {title}
      </h2>
      <Link to={to} className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors">
        Všetky →
      </Link>
    </div>
  )
}

function ClubBadge({ name }) {
  const cfg = getClubByName(name)
  return (
    <span
      className="w-4 h-4 rounded-full shrink-0 inline-flex items-center justify-center text-[7px] font-black text-white"
      style={{ background: cfg?.color ?? '#475569' }}
    >
      {cfg?.short?.slice(0, 2) ?? ''}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 bg-slate-800 px-4 py-3 rounded animate-pulse">
      <div className="w-6 h-4 bg-slate-700 rounded shrink-0" />
      <div className="flex-1 h-4 bg-slate-700 rounded" />
      <div className="w-12 h-6 bg-slate-700 rounded shrink-0" />
      <div className="flex-1 h-4 bg-slate-700 rounded" />
    </div>
  )
}

function MatchResult({ fixture }) {
  const homeWon = fixture.homeGoals > fixture.awayGoals
  const awayWon = fixture.awayGoals > fixture.homeGoals

  return (
    <div className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded transition-colors">
      <span className="text-slate-600 text-xs w-6 text-center shrink-0">{fixture.round}</span>
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className={`text-sm font-medium truncate ${homeWon ? 'text-white' : 'text-slate-400'}`}>
          {fixture.home}
        </span>
        <ClubBadge name={fixture.home} />
      </div>
      <div className="bg-slate-950 px-3 py-1.5 flex items-center gap-1 shrink-0">
        <span className={`text-sm font-black ${homeWon ? 'text-yellow-400' : 'text-slate-300'}`}>
          {fixture.homeGoals}
        </span>
        <span className="text-slate-600 text-xs mx-0.5">–</span>
        <span className={`text-sm font-black ${awayWon ? 'text-yellow-400' : 'text-slate-300'}`}>
          {fixture.awayGoals}
        </span>
      </div>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <ClubBadge name={fixture.away} />
        <span className={`text-sm font-medium truncate ${awayWon ? 'text-white' : 'text-slate-400'}`}>
          {fixture.away}
        </span>
      </div>
    </div>
  )
}

function UpcomingFixture({ fixture }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded transition-colors">
      <span className="text-slate-600 text-xs w-6 text-center shrink-0">{fixture.round}</span>
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-sm font-medium text-white truncate">{fixture.home}</span>
        <ClubBadge name={fixture.home} />
      </div>
      <div className="bg-slate-950 px-3 py-1.5 shrink-0">
        <span className="text-slate-500 text-xs font-black uppercase">vs</span>
      </div>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <ClubBadge name={fixture.away} />
        <span className="text-sm font-medium text-white truncate">{fixture.away}</span>
      </div>
      {fixture.time && (
        <div className="flex items-center gap-1 text-green-500 text-xs shrink-0">
          <Clock size={10} />
          <span>{fixture.time}</span>
        </div>
      )}
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-600 text-xs font-bold uppercase tracking-wide">
      {label}
    </div>
  )
}

export default function MatchesSection() {
  const [recent,   setRecent]   = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [completedSnap, scheduledSnap] = await Promise.all([
          getDocs(query(collection(db, 'fixtures'), where('status', '==', 'completed'))),
          getDocs(query(collection(db, 'fixtures'), where('status', '==', 'scheduled'))),
        ])

        const completed = completedSnap.docs
          .map((d) => d.data())
          .sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
          .slice(0, 5)

        const scheduled = scheduledSnap.docs
          .map((d) => d.data())
          .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
          .slice(0, 5)

        setRecent(completed)
        setUpcoming(scheduled)
      } catch {
        // silently fail — sections stay empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <SectionHeader title="Posledné výsledky" to="/vysledky" />
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : recent.length === 0
                ? <EmptyState label="Žiadne výsledky" />
                : recent.map((f, i) => <MatchResult key={i} fixture={f} />)
            }
          </div>
        </div>
        <div>
          <SectionHeader title="Najbližší program" to="/vysledky" />
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : upcoming.length === 0
                ? <EmptyState label="Žiadny program" />
                : upcoming.map((f, i) => <UpcomingFixture key={i} fixture={f} />)
            }
          </div>
        </div>
      </div>
    </section>
  )
}
