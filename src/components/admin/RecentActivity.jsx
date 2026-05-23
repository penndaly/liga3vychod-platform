import { Newspaper, Swords } from 'lucide-react'

const FORM_CLS = {
  W: 'bg-green-500',
  D: 'bg-yellow-400',
  L: 'bg-red-500',
}

function FormDot({ result }) {
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 inline-block ${FORM_CLS[result] ?? 'bg-slate-700'}`} />
}

function getMatchResult(fixture, clubName) {
  const isHome = fixture.home === clubName
  const gf = isHome ? fixture.homeGoals : fixture.awayGoals
  const ga = isHome ? fixture.awayGoals : fixture.homeGoals
  return gf > ga ? 'W' : gf < ga ? 'L' : 'D'
}

export default function RecentActivity({ fixtures = [], news = [], clubName = '', loading = false }) {
  const recentResults = fixtures
    .filter((f) => f.status === 'completed')
    .slice(-5)
    .reverse()

  const activity = [
    ...recentResults.map((f) => {
      const isHome = f.home === clubName
      const result = getMatchResult(f, clubName)
      return {
        type: 'fixture',
        icon: Swords,
        label: isHome
          ? `${f.homeGoals}:${f.awayGoals} vs ${f.away}`
          : `${f.awayGoals}:${f.homeGoals} @ ${f.home}`,
        sub: `${f.round}. kolo${f.date ? ` · ${f.date}` : ''}`,
        result,
      }
    }),
    ...news.slice(0, 2).map((n) => ({
      type: 'news',
      icon: Newspaper,
      label: n.title,
      sub: n.status === 'published' ? 'Publikované' : 'Koncept',
      result: null,
    })),
  ].slice(0, 5)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Posledná aktivita</h3>
      </div>

      {loading ? (
        <div className="divide-y divide-slate-800/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-700 text-sm font-bold">
          Žiadna aktivita
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {activity.map((item, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              {item.result ? (
                <FormDot result={item.result} />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500/60 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-300 truncate">{item.label}</p>
                <p className="text-xs text-slate-600">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
