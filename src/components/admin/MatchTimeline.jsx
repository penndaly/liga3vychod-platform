const EVENT_CFG = {
  goal: {
    bg: 'bg-green-50 border-green-200',
    icon: '⚽',
    format: (ev) =>
      `GOAL! ${ev.player ?? '?'}${ev.assist ? ` — Assist: ${ev.assist}` : ''}`,
  },
  own_goal: {
    bg: 'bg-green-50 border-green-200',
    icon: '⚽',
    format: (ev) => `Vlastný gól — ${ev.player ?? '?'}`,
  },
  penalty: {
    bg: 'bg-green-50 border-green-200',
    icon: '⚽',
    format: (ev) => `Penalta — ${ev.player ?? '?'}`,
  },
  yellow: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: '🟨',
    format: (ev) =>
      `Žltá karta — ${ev.player ?? '?'}${ev.reason ? ` — ${ev.reason}` : ''}`,
  },
  red: {
    bg: 'bg-red-50 border-red-200',
    icon: '🟥',
    format: (ev) => `Červená karta — ${ev.player ?? '?'}`,
  },
  sub: {
    bg: 'bg-slate-50 border-slate-200',
    icon: '🔄',
    format: (ev) =>
      `Striedanie: ${ev.player_out ?? '?'} → ${ev.player_in ?? '?'}`,
  },
  halftime: {
    bg: 'bg-blue-50 border-blue-200',
    icon: '🔔',
    format: (ev) =>
      `Polčas — ${ev.home_score ?? 0}:${ev.away_score ?? 0}`,
  },
}

export default function MatchTimeline({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 font-bold">
        Žiadne udalosti
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  return (
    <div className="space-y-2 px-4 py-3">
      {sorted.map((ev, i) => {
        const cfg = EVENT_CFG[ev.type] ?? EVENT_CFG.goal
        return (
          <div
            key={i}
            className={`flex items-start gap-3 border rounded-lg px-3 py-2 ${cfg.bg}`}
          >
            <span className="text-xs font-black text-slate-500 w-7 tabular-nums shrink-0 pt-0.5">
              {ev.minute != null ? `${ev.minute}'` : '?'}
            </span>
            <span className="text-sm shrink-0">{cfg.icon}</span>
            <span className="text-xs font-bold text-slate-700 leading-snug">
              {cfg.format(ev)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
