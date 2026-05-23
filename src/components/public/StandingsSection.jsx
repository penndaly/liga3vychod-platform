import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../services/firebase'
import { getClubByName } from '../../config/clubs-config'

const FORM_CLS = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' }

function FormDot({ result }) {
  return <span className={`w-3 h-3 rounded-full shrink-0 inline-block ${FORM_CLS[result] ?? 'bg-slate-700'}`} title={result} />
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-800/60">
      <td className="py-3"><div className="w-6 h-6 bg-slate-800 rounded mx-auto" /></td>
      <td className="py-3 pl-2"><div className="h-4 w-36 bg-slate-800 rounded" /></td>
      {[1,2,3,4,5,6].map((i) => (
        <td key={i} className="py-3 text-center"><div className="h-4 w-6 bg-slate-800 rounded mx-auto" /></td>
      ))}
      <td className="py-3"><div className="flex gap-1 justify-center">{[1,2,3,4,5].map((i) => <div key={i} className="w-3 h-3 bg-slate-800 rounded-full" />)}</div></td>
    </tr>
  )
}

// Top 3 green, bottom 2 red (for a 14-team table showing top 5)
const ZONE_POS = {
  promotion: 'bg-green-500/20 text-green-400',
  relegation: 'bg-red-500/20 text-red-400',
}
const ZONE_ROW = {
  promotion: 'border-l-2 border-green-500',
  relegation: 'border-l-2 border-red-500',
}

function getZone(pos, total = 14) {
  if (pos <= 3) return 'promotion'
  if (pos >= total - 1) return 'relegation'
  return null
}

export default function StandingsSection() {
  const [standings, setStandings] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'standings'), orderBy('pos', 'asc')),
      (snap) => {
        setStandings(snap.docs.filter((d) => d.id !== '_meta').map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  const top5 = standings.slice(0, 5)
  const total = standings.length || 14

  return (
    <section className="bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
              Tabuľka — Top 5
            </h2>
          </div>
          <Link to="/tabulka" className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors">
            Celá tabuľka →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-slate-600 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-center pb-3 w-8 font-bold">#</th>
                <th className="text-left pb-3 pl-2 font-bold">Klub</th>
                <th className="text-center pb-3 w-10 font-bold">Z</th>
                <th className="text-center pb-3 w-10 font-bold">V</th>
                <th className="text-center pb-3 w-10 font-bold">R</th>
                <th className="text-center pb-3 w-10 font-bold">P</th>
                <th className="text-center pb-3 w-16 font-bold">G</th>
                <th className="text-center pb-3 w-14 font-bold text-yellow-400">Body</th>
                <th className="text-center pb-3 font-bold hidden sm:table-cell">Forma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : top5.map((row) => {
                    const zone   = getZone(row.pos, total)
                    const cfg    = getClubByName(row.club)
                    return (
                      <tr
                        key={row.pos}
                        className={`hover:bg-slate-800/40 transition-colors group ${zone ? ZONE_ROW[zone] : 'border-l-2 border-transparent'}`}
                      >
                        <td className="py-3 text-center">
                          <span className={`w-6 h-6 inline-flex items-center justify-center text-xs font-black rounded ${zone ? ZONE_POS[zone] : 'text-slate-500'}`}>
                            {row.pos}
                          </span>
                        </td>
                        <td className="py-3 pl-2">
                          <Link to={`/kluby/${cfg?.id ?? ''}`} className="flex items-center gap-2 group/link min-w-0">
                            <span
                              className="w-5 h-5 rounded-full shrink-0 inline-flex items-center justify-center text-[8px] font-black text-white"
                              style={{ background: cfg?.color ?? '#475569' }}
                            >
                              {cfg?.short?.slice(0,2) ?? ''}
                            </span>
                            <span className="font-medium text-white group-hover/link:text-yellow-400 transition-colors truncate">
                              {row.club}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 text-center text-slate-400">{row.p}</td>
                        <td className="py-3 text-center text-slate-400">{row.w}</td>
                        <td className="py-3 text-center text-slate-400">{row.d}</td>
                        <td className="py-3 text-center text-slate-400">{row.l}</td>
                        <td className="py-3 text-center text-slate-400">{row.gf}:{row.ga}</td>
                        <td className="py-3 text-center font-black text-yellow-400">{row.finalPts}</td>
                        <td className="py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1 justify-center">
                            {row.form.length > 0
                              ? row.form.map((r, i) => <FormDot key={i} result={r} />)
                              : <span className="text-slate-700 text-xs">—</span>
                            }
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
