import { useState } from 'react'
import { X, Activity, Clock, Users } from 'lucide-react'
import { getClubByName } from '../../../config/clubs-config'

// ── Stats tab ──────────────────────────────────────────────────────────────
function StatsRow({ label, home, away }) {
  const total = (home ?? 0) + (away ?? 0)
  const homePct = total === 0 ? 50 : Math.round(((home ?? 0) / total) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-200 tabular-nums w-6">{home ?? 0}</span>
        <span className="text-slate-600 uppercase tracking-widest text-[10px]">{label}</span>
        <span className="text-slate-200 tabular-nums w-6 text-right">{away ?? 0}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
        <div className="h-full bg-yellow-400/70 transition-all" style={{ width: `${homePct}%` }} />
        <div className="h-full flex-1 bg-slate-600/60" />
      </div>
    </div>
  )
}

function StatsTab({ fixture }) {
  const s = fixture.stats
  if (!s) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-700">
        <Activity size={28} className="mb-3" />
        <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne štatistiky</p>
        <p className="text-xs">Štatistiky sa zaznamenajú počas zápasu</p>
      </div>
    )
  }

  const possession = s.possession_home ?? 50
  return (
    <div className="p-5 space-y-4">
      {/* Possession */}
      <div>
        <div className="flex justify-between text-xs font-black mb-1.5">
          <span className="text-yellow-400">{possession}%</span>
          <span className="text-slate-600 uppercase tracking-widest text-[10px]">Držanie lopty</span>
          <span className="text-slate-400">{100 - possession}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-yellow-400 transition-all" style={{ width: `${possession}%` }} />
          <div className="h-full flex-1 bg-slate-600/60" />
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Strely',         home: s.shots_home,    away: s.shots_away    },
          { label: 'Na bránu',       home: s.on_target_home,away: s.on_target_away },
          { label: 'Rohy',           home: s.corners_home,  away: s.corners_away  },
          { label: 'Fauly',          home: s.fouls_home,    away: s.fouls_away    },
          { label: 'Žlté karty',     home: s.yellows_home,  away: s.yellows_away  },
          { label: 'Červené karty',  home: s.reds_home,     away: s.reds_away     },
        ]
          .filter((r) => r.home != null || r.away != null)
          .map((r) => <StatsRow key={r.label} {...r} />)
        }
      </div>
    </div>
  )
}

// ── Timeline tab ───────────────────────────────────────────────────────────
const EVENT_ICONS = {
  goal:      '⚽',
  own_goal:  '⚽',
  penalty:   '⚽',
  yellow:    '🟨',
  red:       '🟥',
  sub:       '🔄',
}

function TimelineTab({ fixture }) {
  const events = fixture.goals ?? []
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-700">
        <Clock size={28} className="mb-3" />
        <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne udalosti</p>
        <p className="text-xs">Priebeh zápasu nie je zaznamenaný</p>
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
  return (
    <div className="p-5 space-y-3">
      {sorted.map((ev, i) => {
        const isHome = ev.team === 'home'
        return (
          <div key={i} className={`flex items-center gap-3 ${isHome ? '' : 'flex-row-reverse'}`}>
            <span className="text-xs font-black text-slate-600 w-8 tabular-nums shrink-0">
              {ev.minute ?? '?'}'
            </span>
            <div className="w-6 h-6 flex items-center justify-center text-sm shrink-0">
              {EVENT_ICONS[ev.type] ?? '⚽'}
            </div>
            <div className={`flex-1 ${isHome ? '' : 'text-right'}`}>
              <p className="text-sm font-bold text-slate-200">{ev.player ?? '—'}</p>
              {ev.type === 'own_goal' && (
                <p className="text-[10px] text-slate-600">vlastný gól</p>
              )}
              {ev.type === 'penalty' && (
                <p className="text-[10px] text-slate-600">penalta</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lineups tab ────────────────────────────────────────────────────────────
function LineupsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-700">
      <Users size={28} className="mb-3" />
      <p className="text-sm font-black uppercase tracking-widest mb-1">Zostavy</p>
      <p className="text-xs">Zostavy nie sú k dispozícii</p>
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'stats',    label: 'Štatistiky', Icon: Activity },
  { id: 'timeline', label: 'Priebeh',    Icon: Clock    },
  { id: 'lineups',  label: 'Zostavy',    Icon: Users    },
]

const STATUS_CFG = {
  live:      { label: 'LIVE',      cls: 'bg-red-500 text-white' },
  completed: { label: 'Odohraný', cls: 'bg-green-500/20 text-green-400' },
  scheduled: { label: 'Plánovaný', cls: 'bg-slate-700 text-slate-400' },
  postponed: { label: 'Odložený', cls: 'bg-yellow-500/20 text-yellow-400' },
}

export default function MatchDetailModal({ fixture, onClose, onEdit }) {
  const [tab, setTab] = useState('stats')

  const homeClub = getClubByName(fixture.home)
  const awayClub = getClubByName(fixture.away)
  const isScored = fixture.status === 'completed' || fixture.status === 'live'
  const homeWon  = isScored && fixture.homeGoals > fixture.awayGoals
  const awayWon  = isScored && fixture.awayGoals > fixture.homeGoals
  const statusCfg = STATUS_CFG[fixture.status] ?? STATUS_CFG.scheduled

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-600 font-bold">
              {fixture.round}. kolo · {fixture.date}
              {fixture.time && ` · ${fixture.time}`}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors"
              >
                Upraviť
              </button>
            )}
            <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Match header */}
        <div className="px-5 py-6 flex items-center gap-4">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: homeClub?.color ?? '#475569' }}
            >
              {homeClub?.short ?? fixture.home.slice(0, 3)}
            </div>
            <p className={`text-xs text-center leading-snug max-w-[100px] ${
              homeWon ? 'font-black text-white' : 'font-bold text-slate-500'
            }`}>
              {fixture.home}
            </p>
          </div>

          {/* Score */}
          <div className="shrink-0 text-center min-w-[96px]">
            {isScored ? (
              <p className="text-4xl font-black text-white tabular-nums">
                {fixture.homeGoals ?? 0}
                <span className="text-slate-700 mx-1">–</span>
                {fixture.awayGoals ?? 0}
              </p>
            ) : (
              <div>
                <p className="text-sm font-black text-slate-500">{fixture.time ?? '—'}</p>
                <p className="text-xs text-slate-700 mt-0.5">vs</p>
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: awayClub?.color ?? '#475569' }}
            >
              {awayClub?.short ?? fixture.away.slice(0, 3)}
            </div>
            <p className={`text-xs text-center leading-snug max-w-[100px] ${
              awayWon ? 'font-black text-white' : 'font-bold text-slate-500'
            }`}>
              {fixture.away}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-b border-slate-800">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors border-b-2 ${
                  active
                    ? 'border-yellow-400 text-white'
                    : 'border-transparent text-slate-600 hover:text-slate-400'
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="max-h-72 overflow-y-auto">
          {tab === 'stats'    && <StatsTab    fixture={fixture} />}
          {tab === 'timeline' && <TimelineTab fixture={fixture} />}
          {tab === 'lineups'  && <LineupsTab />}
        </div>
      </div>
    </div>
  )
}
