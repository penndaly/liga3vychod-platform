import { Radio } from 'lucide-react'
import { useLiveCollection } from '../../../hooks/useFirestore'

function LiveMatchCard({ match }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-500 text-xs font-black uppercase">{match.minute ?? 'Live'}'</span>
      </div>
      <div className="flex-1 text-right text-sm font-medium text-slate-900 truncate">
        {match.home}
      </div>
      <div className="bg-slate-900 text-white text-sm font-black px-4 py-2 rounded-lg tabular-nums shrink-0">
        {match.homeGoals ?? 0} – {match.awayGoals ?? 0}
      </div>
      <div className="flex-1 text-left text-sm font-medium text-slate-900 truncate">
        {match.away}
      </div>
    </div>
  )
}

export default function LiveMatches() {
  const { data: matches, loading } = useLiveCollection('matches')
  const live = matches.filter((m) => m.status === 'live')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={14} className="text-red-500" />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Live zápasy
        </h2>
        {live.length > 0 && (
          <span className="ml-auto text-xs bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-full">
            {live.length} live
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-6">Načítavam...</p>
      ) : live.length === 0 ? (
        <div className="text-center py-8">
          <Radio size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-400">Žiadne live zápasy</p>
        </div>
      ) : (
        <div className="space-y-2">
          {live.map((m) => <LiveMatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}
