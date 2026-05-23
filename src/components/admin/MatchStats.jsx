export default function MatchStats({ stats }) {
  if (!stats) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 font-bold">
        Štatistiky nie sú k dispozícii
      </div>
    )
  }

  const possession = stats.possession_home ?? 50

  const rows = [
    { label: 'Držanie lopty', home: possession, away: 100 - possession, isPct: true },
    { label: 'Strely', home: stats.shots_home ?? 0, away: stats.shots_away ?? 0 },
    { label: 'Na bránu', home: stats.on_target_home ?? 0, away: stats.on_target_away ?? 0 },
    { label: 'Rohy', home: stats.corners_home ?? 0, away: stats.corners_away ?? 0 },
    { label: 'Žlté karty', home: stats.yellows_home ?? 0, away: stats.yellows_away ?? 0 },
    ...((stats.reds_home || stats.reds_away)
      ? [{ label: 'Červené karty', home: stats.reds_home ?? 0, away: stats.reds_away ?? 0 }]
      : []),
  ]

  return (
    <div className="space-y-4 px-4 py-3">
      {rows.map(({ label, home, away, isPct }) => {
        const total = home + away
        const homePct = total === 0 ? 50 : Math.round((home / total) * 100)
        return (
          <div key={label}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700 tabular-nums w-8">
                {isPct ? `${home}%` : home}
              </span>
              <span className="text-slate-400 uppercase tracking-widest text-[10px] text-center flex-1 px-2">
                {label}
              </span>
              <span className="text-slate-700 tabular-nums w-8 text-right">
                {isPct ? `${away}%` : away}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-px">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${homePct}%` }}
              />
              <div
                className="h-full bg-orange-400 rounded-full transition-all flex-1"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
