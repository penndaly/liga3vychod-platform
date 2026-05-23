import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { ChevronLeft, Calendar, Clock, Loader } from 'lucide-react'
import { db } from '../../services/firebase'
import { getClubByName } from '../../config/clubs-config'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const STATUS_LABEL = {
  completed: 'FT',
  live:      'LIVE',
  scheduled: 'Plánovaný',
  postponed: 'Odložený',
}

const EVENT_CFG = {
  goal:     { icon: '⚽', format: (ev) => `GOAL — ${ev.player ?? '?'}${ev.assist ? ` (Assist: ${ev.assist})` : ''}`, color: 'text-green-400' },
  own_goal: { icon: '⚽', format: (ev) => `Vlastný gól — ${ev.player ?? '?'}`, color: 'text-red-400' },
  penalty:  { icon: '⚽', format: (ev) => `Penalta — ${ev.player ?? '?'}`, color: 'text-green-400' },
  yellow:   { icon: '🟨', format: (ev) => `Žltá karta — ${ev.player ?? '?'}${ev.reason ? ` (${ev.reason})` : ''}`, color: 'text-yellow-400' },
  red:      { icon: '🟥', format: (ev) => `Červená karta — ${ev.player ?? '?'}`, color: 'text-red-400' },
  sub:      { icon: '🔄', format: (ev) => `Striedanie: ${ev.player_out ?? '?'} → ${ev.player_in ?? '?'}`, color: 'text-slate-400' },
  halftime: { icon: '🔔', format: (ev) => `Polčas — ${ev.home_score ?? 0}:${ev.away_score ?? 0}`, color: 'text-blue-400' },
}

function ClubBadge({ name, align = 'left' }) {
  const club = getClubByName(name)
  return (
    <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 font-black text-white text-sm"
        style={{ background: club?.color ?? '#475569' }}
      >
        {club?.short ?? (name ?? '?').slice(0, 3)}
      </div>
      <span className="text-base sm:text-lg font-black text-white leading-tight">{name}</span>
    </div>
  )
}

function StatRow({ label, home, away, isPct }) {
  const total = home + away
  const homePct = total === 0 ? 50 : Math.round((home / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-300 tabular-nums w-8">{isPct ? `${home}%` : home}</span>
        <span className="text-slate-600 uppercase tracking-widest text-[10px] text-center flex-1 px-2">{label}</span>
        <span className="text-slate-300 tabular-nums w-8 text-right">{isPct ? `${away}%` : away}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-px">
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-orange-400 rounded-full flex-1" />
      </div>
    </div>
  )
}

function StatsPanel({ stats }) {
  if (!stats) {
    return (
      <div className="py-12 text-center text-sm text-slate-600 font-bold">
        Štatistiky nie sú k dispozícii
      </div>
    )
  }
  const possession = stats.possession_home ?? 50
  const rows = [
    { label: 'Držanie lopty', home: possession,          away: 100 - possession,         isPct: true },
    { label: 'Strely',        home: stats.shots_home ?? 0,  away: stats.shots_away ?? 0  },
    { label: 'Na bránu',      home: stats.on_target_home ?? 0, away: stats.on_target_away ?? 0 },
    { label: 'Rohy',          home: stats.corners_home ?? 0,   away: stats.corners_away ?? 0   },
    { label: 'Žlté karty',    home: stats.yellows_home ?? 0,   away: stats.yellows_away ?? 0   },
    ...((stats.reds_home || stats.reds_away)
      ? [{ label: 'Červené karty', home: stats.reds_home ?? 0, away: stats.reds_away ?? 0 }]
      : []),
  ]
  return (
    <div className="space-y-5">
      {rows.map((r) => <StatRow key={r.label} {...r} />)}
    </div>
  )
}

function TimelinePanel({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-600 font-bold">
        Žiadne udalosti
      </div>
    )
  }
  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
  return (
    <div className="space-y-2">
      {sorted.map((ev, i) => {
        const cfg = EVENT_CFG[ev.type] ?? EVENT_CFG.goal
        return (
          <div key={i} className="flex items-start gap-3 bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-600 w-7 tabular-nums shrink-0 pt-0.5">
              {ev.minute != null ? `${ev.minute}'` : '?'}
            </span>
            <span className="text-sm shrink-0">{cfg.icon}</span>
            <span className={`text-xs font-bold leading-snug pt-0.5 ${cfg.color}`}>
              {cfg.format(ev)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const TABS = [
  { id: 'timeline', label: 'Priebeh'     },
  { id: 'stats',    label: 'Štatistiky' },
]

export default function MatchDetail() {
  const { matchId } = useParams()
  const [fixture, setFixture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('timeline')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'fixtures', matchId))
        if (snap.exists()) setFixture({ id: snap.id, ...snap.data() })
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [matchId])

  const isScored   = fixture && (fixture.status === 'completed' || fixture.status === 'live')
  const homeClub   = fixture ? getClubByName(fixture.home) : null
  const awayClub   = fixture ? getClubByName(fixture.away) : null
  const homeWon    = isScored && (fixture.homeGoals ?? 0) > (fixture.awayGoals ?? 0)
  const awayWon    = isScored && (fixture.awayGoals ?? 0) > (fixture.homeGoals ?? 0)

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Back */}
        <Link to="/vysledky" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-400 transition-colors">
          <ChevronLeft size={14} /> Výsledky
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader size={28} className="text-slate-700 animate-spin" />
          </div>
        ) : !fixture ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-24">
            <p className="text-slate-600 text-sm font-bold">Zápas nenájdený.</p>
          </div>
        ) : (
          <>
            {/* Scoreboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Top accent */}
              <div className="h-0.5 bg-gradient-to-r from-yellow-400 via-green-500 to-transparent" />

              <div className="px-6 py-8">
                {/* Round + date row */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-lg">
                    {fixture.round}. kolo
                  </span>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    {fixture.date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {fixture.date}
                      </span>
                    )}
                    {fixture.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {fixture.time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams + score */}
                <div className="flex items-center gap-4">
                  {/* Home */}
                  <div className="flex-1">
                    <Link
                      to={`/kluby/${homeClub?.id ?? ''}`}
                      className="group flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg"
                        style={{ background: homeClub?.color ?? '#475569' }}
                      >
                        {homeClub?.short ?? (fixture.home ?? '?').slice(0, 3)}
                      </div>
                      <span className={`text-sm font-black text-center leading-tight ${homeWon ? 'text-white' : 'text-slate-400'}`}>
                        {fixture.home}
                      </span>
                    </Link>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {isScored ? (
                      <div className="flex items-center gap-1">
                        <span className={`text-4xl sm:text-5xl font-black tabular-nums ${homeWon ? 'text-white' : 'text-slate-500'}`}>
                          {fixture.homeGoals ?? 0}
                        </span>
                        <span className="text-slate-700 text-3xl font-black mx-1">–</span>
                        <span className={`text-4xl sm:text-5xl font-black tabular-nums ${awayWon ? 'text-white' : 'text-slate-500'}`}>
                          {fixture.awayGoals ?? 0}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-black text-slate-700">vs</span>
                    )}

                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      fixture.status === 'live'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : fixture.status === 'completed'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-800 text-slate-500'
                    }`}>
                      {STATUS_LABEL[fixture.status] ?? fixture.status}
                    </span>
                  </div>

                  {/* Away */}
                  <div className="flex-1">
                    <Link
                      to={`/kluby/${awayClub?.id ?? ''}`}
                      className="group flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg"
                        style={{ background: awayClub?.color ?? '#475569' }}
                      >
                        {awayClub?.short ?? (fixture.away ?? '?').slice(0, 3)}
                      </div>
                      <span className={`text-sm font-black text-center leading-tight ${awayWon ? 'text-white' : 'text-slate-400'}`}>
                        {fixture.away}
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Venue */}
                {fixture.venue && (
                  <p className="text-xs text-slate-600 text-center mt-6">{fixture.venue}</p>
                )}
              </div>
            </div>

            {/* Timeline + Stats tabs */}
            {(fixture.status === 'completed' || fixture.status === 'live') && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex border-b border-slate-800">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-colors ${
                        tab === t.id
                          ? 'text-yellow-400 border-b-2 border-yellow-400 -mb-px'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="p-5">
                  {tab === 'timeline'
                    ? <TimelinePanel events={fixture.events} />
                    : <StatsPanel    stats={fixture.stats}   />
                  }
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
