import { Target } from 'lucide-react'
import { TOP_SCORERS } from '../../data/placeholder'

export default function TopScorers() {
  return (
    <section className="bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Target size={14} className="text-yellow-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
            Najlepší strelci
          </h2>
        </div>

        <div className="max-w-lg space-y-2">
          {TOP_SCORERS.map((scorer) => (
            <div
              key={scorer.rank}
              className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded transition-colors"
            >
              <span
                className={`text-sm font-black w-6 text-center shrink-0 ${
                  scorer.rank === 1 ? 'text-yellow-400' : 'text-slate-600'
                }`}
              >
                {scorer.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{scorer.name}</p>
                <p className="text-slate-500 text-xs truncate">{scorer.club}</p>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="text-yellow-400 font-black text-xl">{scorer.goals}</span>
                <span className="text-slate-600 text-xs">gólov</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
