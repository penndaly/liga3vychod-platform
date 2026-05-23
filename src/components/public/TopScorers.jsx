import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { Target } from 'lucide-react'
import { db } from '../../services/firebase'
import { getClubByName } from '../../config/clubs-config'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 bg-slate-800 px-4 py-3 rounded animate-pulse">
      <div className="w-6 h-4 bg-slate-700 rounded shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 bg-slate-700 rounded" />
        <div className="h-3 w-24 bg-slate-700 rounded" />
      </div>
      <div className="w-8 h-7 bg-slate-700 rounded shrink-0" />
    </div>
  )
}

export default function TopScorers() {
  const [scorers, setScorers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'player_stats'))
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => (p.goals ?? 0) > 0)
          .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
          .slice(0, 5)
        setScorers(sorted)
      } catch {
        // silently fail — section stays empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-yellow-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
              Najlepší strelci
            </h2>
          </div>
          <Link to="/statistiky" className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors">
            Celé štatistiky →
          </Link>
        </div>

        <div className="max-w-lg space-y-2">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : scorers.length === 0
              ? (
                <div className="flex items-center justify-center py-10 text-slate-600 text-xs font-bold uppercase tracking-wide">
                  Žiadne štatistiky
                </div>
              )
              : scorers.map((scorer, i) => {
                  const cfg = getClubByName(scorer.club)
                  const rank = i + 1
                  return (
                    <div
                      key={scorer.id}
                      className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded transition-colors"
                    >
                      <span className={`text-sm font-black w-6 text-center shrink-0 ${rank === 1 ? 'text-yellow-400' : 'text-slate-600'}`}>
                        {rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{scorer.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {cfg && (
                            <span
                              className="w-3 h-3 rounded-full shrink-0 inline-block"
                              style={{ background: cfg.color }}
                            />
                          )}
                          <p className="text-slate-500 text-xs truncate">{scorer.club}</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="text-yellow-400 font-black text-xl">{scorer.goals}</span>
                        <span className="text-slate-600 text-xs">gólov</span>
                      </div>
                    </div>
                  )
                })
          }
        </div>
      </div>
    </section>
  )
}
