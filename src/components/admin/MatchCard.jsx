import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '../../services/firebase'
import { getClubByName } from '../../config/clubs-config'
import MatchStats from './MatchStats'
import MatchTimeline from './MatchTimeline'

function ClubBadge({ name, size = 'md' }) {
  const club = getClubByName(name)
  const dim = size === 'lg' ? 'w-10 h-10 text-xs' : 'w-7 h-7 text-[10px]'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-black text-white shrink-0`}
      style={{ background: club?.color ?? '#475569' }}
    >
      {club?.short ?? (name ?? '?').slice(0, 3)}
    </div>
  )
}

function StatusBadge({ status, time }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-md border bg-red-50 border-red-200 text-red-700">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        LIVE
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center text-xs font-black px-2 py-0.5 rounded-md border bg-green-50 border-green-200 text-green-700">
        FT
      </span>
    )
  }
  return (
    <span className="text-xs font-bold text-slate-400">
      {time ?? '—:—'}
    </span>
  )
}

const TABS = [
  { id: 'stats',    label: 'Štatistiky' },
  { id: 'timeline', label: 'Priebeh'    },
  { id: 'lineups',  label: 'Zostavy'   },
]

export default function MatchCard({ match, onExpand, onMarkComplete }) {
  const [liveMatch, setLiveMatch] = useState(match)
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('stats')

  // Per-card real-time listener for live matches
  useEffect(() => {
    if (match.status === 'live') {
      const unsubscribe = onSnapshot(
        doc(db, 'fixtures', match.id),
        (snap) => {
          if (snap.exists()) {
            setLiveMatch({ id: snap.id, ...snap.data() })
          }
        },
      )
      return unsubscribe
    } else {
      setLiveMatch(match)
    }
  }, [match.id, match.status])

  const isLive      = liveMatch.status === 'live'
  const isCompleted = liveMatch.status === 'completed'
  const isScored    = isLive || isCompleted
  const homeWon     = isScored && liveMatch.homeGoals > liveMatch.awayGoals
  const awayWon     = isScored && liveMatch.awayGoals > liveMatch.homeGoals
  const showTabs    = isLive || isCompleted

  return (
    <div className={`rounded-xl border overflow-hidden bg-white transition-shadow ${
      isLive
        ? 'border-2 border-red-300 shadow-md shadow-red-100'
        : 'border border-slate-200 hover:shadow-sm'
    }`}>

      {/* Card header: competition / round + status badge */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-400">
          {liveMatch.competition
            ? <span className="mr-1.5 text-slate-500">{liveMatch.competition}</span>
            : null}
          Kolo {liveMatch.round}
          {liveMatch.date && <span className="ml-1.5 font-normal text-slate-400">{liveMatch.date}</span>}
        </span>
        <StatusBadge status={liveMatch.status} time={liveMatch.time} />
      </div>

      {/* Teams + score */}
      <div className="px-4 py-4 flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0 flex-row-reverse">
          <ClubBadge name={liveMatch.home} size="lg" />
          <span className={`text-sm truncate text-right ${
            homeWon ? 'font-black text-slate-900' : 'font-medium text-slate-500'
          }`}>
            {liveMatch.home}
          </span>
        </div>

        {/* Score */}
        <div className="shrink-0 w-20 flex justify-center">
          {isScored ? (
            <div className="bg-slate-900 text-white font-black text-base tabular-nums px-3 py-1 rounded-lg">
              {liveMatch.homeGoals ?? 0}–{liveMatch.awayGoals ?? 0}
            </div>
          ) : (
            <div className="text-slate-300 text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5">
              vs
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <ClubBadge name={liveMatch.away} size="lg" />
          <span className={`text-sm truncate ${
            awayWon ? 'font-black text-slate-900' : 'font-medium text-slate-500'
          }`}>
            {liveMatch.away}
          </span>
        </div>
      </div>

      {/* Inline tabs (live / completed only) */}
      {showTabs && expanded && (
        <>
          <div className="flex border-t border-slate-100">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 ${
                  tab === id
                    ? 'border-yellow-400 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-h-60 overflow-y-auto">
            {tab === 'stats'    && <MatchStats stats={liveMatch.stats} />}
            {tab === 'timeline' && <MatchTimeline events={liveMatch.goals ?? []} />}
            {tab === 'lineups'  && (
              <div className="py-10 text-center text-sm text-slate-400 font-bold">
                Zostavy nie sú k dispozícii
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-2">
        {showTabs && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            {expanded
              ? <><ChevronUp size={12} /> Skryť</>
              : <><ChevronDown size={12} /> Rozbaliť</>}
          </button>
        )}

        <div className="flex-1" />

        {onExpand && (
          <button
            onClick={() => onExpand(liveMatch)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Rozšíriť
          </button>
        )}

        {isLive && onMarkComplete && (
          <button
            onClick={() => onMarkComplete(liveMatch)}
            className="text-xs font-bold px-3 py-1.5 bg-yellow-400 text-slate-950 rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Ukončiť
          </button>
        )}

        {isCompleted && (
          <button
            onClick={() => onExpand?.(liveMatch)}
            className="text-xs font-bold px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Protokol
          </button>
        )}

        {liveMatch.status === 'scheduled' && (
          <button
            onClick={() => onMarkComplete?.({ ...liveMatch, status: 'live', homeGoals: 0, awayGoals: 0 })}
            className="text-xs font-bold px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors"
          >
            Spustiť live
          </button>
        )}
      </div>
    </div>
  )
}
